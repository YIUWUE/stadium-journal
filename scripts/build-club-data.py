#!/usr/bin/env python3
"""Build result-only club aggregates from the original Football-Data.co.uk CSVs.

Standard-library only. Cached source CSVs stay in ignored research/football-data.
Run with --offline to reproduce aggregates from the exact cached source bytes.
No odds, bookmaker fields or individual match records enter the shipped JSON.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import re
import time
import unicodedata
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
SEASONS = ["2021", "2122", "2223", "2324", "2425"]
LEAGUES = {
    "E0": ("England", "Premier League"),
    "SP1": ("Spain", "La Liga"),
    "D1": ("Germany", "Bundesliga"),
    "I1": ("Italy", "Serie A"),
    "F1": ("France", "Ligue 1"),
    "P1": ("Portugal", "Primeira Liga"),
    "N1": ("Netherlands", "Eredivisie"),
    "T1": ("Turkey", "Super Lig"),
    "SC0": ("Scotland", "Premiership"),
    "ARG": ("Argentina", "Liga Profesional (source label)"),
    "BRA": ("Brazil", "Serie A"),
}

# Exact publisher names, not fuzzy matches to unrelated similarly named teams.
CLUBS = {
    "bernabeu": ("Real Madrid", "皇家马德里", "SP1", ["Real Madrid"]),
    "campnou": ("Barcelona", "巴塞罗那", "SP1", ["Barcelona"]),
    "anfield": ("Liverpool", "利物浦", "E0", ["Liverpool"]),
    "allianz": ("Bayern Munich", "拜仁慕尼黑", "D1", ["Bayern Munich"]),
    "sansiro": ("AC Milan", "AC 米兰", "I1", ["Milan"]),
    "oldtrafford": ("Manchester United", "曼彻斯特联", "E0", ["Man United"]),
    "dortmund": ("Borussia Dortmund", "多特蒙德", "D1", ["Dortmund"]),
    "paris": ("Paris Saint-Germain", "巴黎圣日耳曼", "F1", ["Paris SG"]),
    "emirates": ("Arsenal", "阿森纳", "E0", ["Arsenal"]),
    "juventus": ("Juventus", "尤文图斯", "I1", ["Juventus"]),
    "etihad": ("Manchester City", "曼彻斯特城", "E0", ["Man City"]),
    "tottenham": ("Tottenham Hotspur", "托特纳姆热刺", "E0", ["Tottenham"]),
    "stamfordbridge": ("Chelsea", "切尔西", "E0", ["Chelsea"]),
    "metropolitano": ("Atletico Madrid", "马德里竞技", "SP1", ["Ath Madrid"]),
    "dragao": ("FC Porto", "波尔图", "P1", ["Porto"]),
    "luz": ("Benfica", "本菲卡", "P1", ["Benfica"]),
    "galatasaray": ("Galatasaray", "加拉塔萨雷", "T1", ["Galatasaray"]),
    "cruyff": ("Ajax", "阿贾克斯", "N1", ["Ajax"]),
    "feyenoord": ("Feyenoord", "费耶诺德", "N1", ["Feyenoord"]),
    "celtic": ("Celtic", "凯尔特人", "SC0", ["Celtic"]),
    "bombonera": ("Boca Juniors", "博卡青年", "ARG", ["Boca Juniors"]),
    "monumental": ("River Plate", "河床", "ARG", ["River Plate"]),
    "maracana": ("Flamengo", "弗拉门戈", "BRA", ["Flamengo RJ"]),
    "napoli": ("Napoli", "那不勒斯", "I1", ["Napoli"]),
}


def utc_timestamp(timestamp=None):
    value = datetime.fromtimestamp(timestamp, timezone.utc) if timestamp else datetime.now(timezone.utc)
    return value.isoformat(timespec="seconds").replace("+00:00", "Z")


def normalized_name(value):
    return re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower())


def descriptors():
    result = []
    for code in list(LEAGUES)[:9]:
        for season in SEASONS:
            result.append({"id": code + "-" + season, "leagueCode": code, "season": season,
                           "url": f"https://www.football-data.co.uk/mmz4281/{season}/{code}.csv"})
    for code in ["ARG", "BRA"]:
        result.append({"id": code, "leagueCode": code, "calendarYears": [2021, 2022, 2023, 2024, 2025],
                       "url": f"https://www.football-data.co.uk/new/{code}.csv"})
    return result


def fetch_source(source, cache_dir, offline, refresh):
    path = cache_dir / (source["id"] + ".csv")
    if refresh or not path.exists():
        if offline:
            raise RuntimeError("Missing offline source: " + str(path))
        request = Request(source["url"], headers={
            "User-Agent": "BeyondTheStandsClubDataset/1.0 (result aggregation; source attribution)",
            "Accept": "text/csv,*/*;q=0.5",
        })
        # One bounded retry, respecting short Retry-After values. No endpoint hopping.
        for attempt in range(2):
            try:
                with urlopen(request, timeout=22) as response:
                    payload = response.read()
                if not payload or payload.lstrip().startswith(b"<"):
                    raise RuntimeError("Source is empty or HTML: " + source["url"])
                path.write_bytes(payload)
                break
            except HTTPError as error:
                if attempt or error.code not in (429, 502, 503, 504):
                    raise
                retry = error.headers.get("Retry-After", "3")
                if not retry.isdigit() or int(retry) > 15:
                    raise RuntimeError("Source rate-limited; retry later: " + source["url"]) from error
                time.sleep(max(1, int(retry)))
        time.sleep(0.45)
    payload = path.read_bytes()
    return {**source, "cacheFile": str(path.relative_to(ROOT)), "bytes": len(payload),
            "sha256": hashlib.sha256(payload).hexdigest(), "retrievedAt": utc_timestamp(path.stat().st_mtime)}, payload


def parse_date(value):
    for fmt in ("%d/%m/%Y", "%d/%m/%y", "%Y-%m-%d"):
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            pass
    raise ValueError("Unrecognized source date: " + value)


def read_fixtures(source, payload):
    try:
        text = payload.decode("utf-8-sig")
        encoding = "utf-8-sig"
    except UnicodeDecodeError:
        text = payload.decode("cp1252")
        encoding = "cp1252"
    reader = csv.DictReader(io.StringIO(text))
    south_america = source["leagueCode"] in ("ARG", "BRA")
    columns = ("Home", "Away", "HG", "AG", "Res") if south_america else ("HomeTeam", "AwayTeam", "FTHG", "FTAG", "FTR")
    home_col, away_col, hg_col, ag_col, result_col = columns
    required = {"Date", home_col, away_col, hg_col, ag_col}
    if not required.issubset(reader.fieldnames or []):
        raise RuntimeError("Missing score columns: " + source["id"])
    counts = {"rawRows": 0, "blankRows": 0, "invalidDateRows": 0, "invalidFixtureRows": 0,
              "outsideWindowRows": 0, "unplayedOrMissingScoreRows": 0}
    fixtures = []
    source_seasons = {}
    calendar_years = {}
    for row in reader:
        values = {k: (v or "").strip() for k, v in row.items() if isinstance(k, str)}
        if not any(values.values()):
            counts["blankRows"] += 1
            continue
        counts["rawRows"] += 1
        home, away = values.get(home_col, ""), values.get(away_col, "")
        if not home or not away:
            counts["invalidFixtureRows"] += 1
            continue
        try:
            played = parse_date(values.get("Date", ""))
        except ValueError:
            counts["invalidDateRows"] += 1
            continue
        if south_america and not (date(2021, 1, 1) <= played <= date(2025, 12, 31)):
            counts["outsideWindowRows"] += 1
            continue
        try:
            hg, ag = int(values[hg_col]), int(values[ag_col])
            if hg < 0 or ag < 0:
                raise ValueError("negative goals")
        except (ValueError, KeyError):
            counts["unplayedOrMissingScoreRows"] += 1
            continue
        result = "H" if hg > ag else "A" if ag > hg else "D"
        if values.get(result_col) in ("H", "A", "D") and values[result_col] != result:
            raise RuntimeError(f"Score/result conflict in {source['id']}: {played} {home} vs {away}")
        fixtures.append({"leagueCode": source["leagueCode"], "date": played.isoformat(),
                         "home": home, "away": away, "hg": hg, "ag": ag, "sourceId": source["id"]})
        calendar_years[str(played.year)] = calendar_years.get(str(played.year), 0) + 1
        if south_america:
            source_season = values.get("Season", "unspecified")
            source_seasons[source_season] = source_seasons.get(source_season, 0) + 1
    return fixtures, {**counts, "encoding": encoding, "windowResultRows": len(fixtures),
                      "calendarYearRows": dict(sorted(calendar_years.items())),
                      **({"sourceSeasonRows": dict(sorted(source_seasons.items()))} if south_america else {})}


def aggregate(fixtures):
    aliases = {}
    for stadium_id, (_, _, league, names) in CLUBS.items():
        for name in names:
            key = (league, normalized_name(name))
            if key in aliases:
                raise RuntimeError("Ambiguous club alias: " + name)
            aliases[key] = stadium_id
    appearances = {club_id: [] for club_id in CLUBS}
    involved = set()
    source_involved = {}
    for key, fixture in fixtures.items():
        selected = False
        for is_home, source_name in ((True, fixture["home"]), (False, fixture["away"])):
            club_id = aliases.get((fixture["leagueCode"], normalized_name(source_name)))
            if club_id:
                appearances[club_id].append((fixture, is_home, source_name))
                selected = True
        if selected:
            involved.add(key)
            source_involved[fixture["sourceId"]] = source_involved.get(fixture["sourceId"], 0) + 1

    clubs, gaps = {}, []
    for club_id, (english, chinese, league, names) in CLUBS.items():
        records = appearances[club_id]
        n = len(records)
        if not n:
            gaps.append({"stadiumId": club_id, "reason": "No matched results", "aliases": names})
        item = {"clubName": english, "displayName": chinese, "leagueCode": league,
                "sourceNames": sorted({r[2] for r in records}), "matches": n,
                "wins": 0, "draws": 0, "losses": 0, "goalsFor": 0, "goalsAgainst": 0,
                "cleanSheets": 0, "scoredMatches": 0, "bothTeamsScoredMatches": 0,
                "over25Matches": 0, "homeMatches": 0, "awayMatches": 0,
                "homePoints": 0, "awayPoints": 0,
                "homeWins": 0, "homeDraws": 0, "homeLosses": 0,
                "awayWins": 0, "awayDraws": 0, "awayLosses": 0}
        dates = []
        for fixture, is_home, _ in records:
            gf, ga = (fixture["hg"], fixture["ag"]) if is_home else (fixture["ag"], fixture["hg"])
            side = "home" if is_home else "away"
            result = "wins" if gf > ga else "draws" if gf == ga else "losses"
            points = 3 if gf > ga else 1 if gf == ga else 0
            item[result] += 1
            item[side + result.title()] += 1
            item[side + "Matches"] += 1
            item[side + "Points"] += points
            item["goalsFor"] += gf
            item["goalsAgainst"] += ga
            item["cleanSheets"] += ga == 0
            item["scoredMatches"] += gf > 0
            item["bothTeamsScoredMatches"] += gf > 0 and ga > 0
            item["over25Matches"] += gf + ga > 2
            dates.append(fixture["date"])
        ratio = lambda numerator, denominator: round(numerator / denominator, 6) if denominator else None
        item.update({
            "goalsPerMatch": ratio(item["goalsFor"] + item["goalsAgainst"], n),
            "scoringRate": ratio(item["goalsFor"], n),
            "concedingRate": ratio(item["goalsAgainst"], n),
            "cleanSheetRate": ratio(item["cleanSheets"], n),
            "winRate": ratio(item["wins"], n),
            "homePointsRate": ratio(item["homePoints"], 3 * item["homeMatches"]),
            "awayPointsRate": ratio(item["awayPoints"], 3 * item["awayMatches"]),
            "firstDate": min(dates) if dates else None,
            "lastDate": max(dates) if dates else None,
            "sharedVenue": club_id in ("sansiro", "maracana"),
        })
        item["homeLift"] = round(item["homePointsRate"] - item["awayPointsRate"], 6) if n else None
        if club_id == "sansiro":
            item["sharedVenueNote"] = "AC Milan only; San Siro also hosts Internazionale."
        if club_id == "maracana":
            item["sharedVenueNote"] = "Flamengo only; Maracana also hosts Fluminense."
        assert item["wins"] + item["draws"] + item["losses"] == n
        assert item["homeMatches"] + item["awayMatches"] == n
        clubs[club_id] = item
    return clubs, involved, source_involved, gaps


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--offline", action="store_true", help="Use cached original CSVs only")
    parser.add_argument("--refresh", action="store_true", help="Replace cached CSVs from the publisher")
    parser.add_argument("--cache-dir", type=Path, default=ROOT / "research" / "football-data")
    parser.add_argument("--output", type=Path, default=ROOT / "dist" / "assets" / "club-match-data.json")
    args = parser.parse_args()
    if args.offline and args.refresh:
        parser.error("--offline and --refresh are mutually exclusive")
    args.cache_dir.mkdir(parents=True, exist_ok=True)
    sources = descriptors()
    with ThreadPoolExecutor(max_workers=2) as executor:
        downloads = list(executor.map(lambda s: fetch_source(s, args.cache_dir, args.offline, args.refresh), sources))
    fixtures, source_details = {}, []
    for source, payload in downloads:
        rows, quality = read_fixtures(source, payload)
        duplicate_rows, accepted = 0, 0
        for fixture in rows:
            key = (fixture["leagueCode"], fixture["date"], fixture["home"], fixture["away"])
            if key in fixtures:
                previous = fixtures[key]
                if (previous["hg"], previous["ag"]) != (fixture["hg"], fixture["ag"]):
                    raise RuntimeError("Conflicting duplicate fixture: " + repr(key))
                duplicate_rows += 1
                continue
            fixtures[key] = fixture
            accepted += 1
        source_details.append({**source, **quality, "uniqueMatches": accepted, "duplicateRows": duplicate_rows})
    clubs, involved, source_involved, gaps = aggregate(fixtures)
    for source in source_details:
        source["clubInvolvedUniqueMatches"] = source_involved.get(source["id"], 0)
    normalized_results = [list(key) + [fixtures[key]["hg"], fixtures[key]["ag"]] for key in sorted(fixtures)]
    results_sha = hashlib.sha256(json.dumps(normalized_results, separators=(",", ":"), ensure_ascii=False).encode()).hexdigest()
    totals_by_league = {code: sum(f["leagueCode"] == code for f in fixtures.values()) for code in LEAGUES}
    metadata = {
        "schemaVersion": 1, "sourceName": "Football-Data.co.uk", "sourceHomepage": "https://www.football-data.co.uk/data.php",
        "sourceUrls": [s["url"] for s in sources],
        "period": "Europe: 2020/21-2024/25; Argentina and Brazil: calendar years 2021-2025",
        "periodZh": "欧洲 2020/21—2024/25；阿根廷、巴西按 2021—2025 自然年",
        "periodWindows": {"europeSeasonCodes": SEASONS, "southAmericaStart": "2021-01-01", "southAmericaEnd": "2025-12-31"},
        "compiledAt": utc_timestamp(), "totalMatches": len(fixtures),
        "clubInvolvedUniqueMatches": len(involved), "clubMatchAppearances": sum(c["matches"] for c in clubs.values()),
        "clubCount": len(clubs), "sourceFileCount": len(source_details),
        "sourceLeagueMatchCounts": totals_by_league, "resultsSha256": results_sha,
        "sources": source_details, "buildScript": "scripts/build-club-data.py", "gaps": gaps,
        "scope": "Published domestic top-division result frequencies. Not personality evidence or a league-adjusted global strength ranking.",
        "sourceUse": {
            "termsUrl": "https://football-data.co.uk/data.php",
            "termsCheckedAt": "2026-11-02",
            "restriction": "The publisher states private individual use is intended, not commercial or data-training products using automated bots/scrapers/AI. No open-data or redistribution license is asserted here.",
            "currentContext": "Owner-only private personal project; transparent arithmetic preference rules; no model training.",
            "futureUse": "Reassess source permission before public, commercial, bulk redistribution or data-training use. This aggregate file grants no additional source rights.",
        },
        "limits": [
            "Different leagues have different strength, schedules, scoring environments and competition formats.",
            "Europe uses five completed split-year seasons; Argentina and Brazil use five complete calendar date windows.",
            "Argentina league formats/phases changed; only fixtures present in the publisher ARG file are included.",
            "Home means the publisher home-designated side, not proof that a match took place at the displayed stadium.",
            "Shared-venue records deliberately select AC Milan and Flamengo, not every tenant club.",
            "Only fixtures in the selected publisher league CSVs are included; Argentina's league-championship phases can include cup-style or knockout formats.",
            "No European competitions, internationals, other cup files, player, fan-personality, atmosphere, ticket-price or live-match data are inferred.",
            "Source corrections, rescheduled games and awarded results are represented as published; there is no independent completeness claim.",
        ],
    }
    output = {"metadata": metadata, "clubs": clubs}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"sourceMatches": len(fixtures), "clubInvolvedUniqueMatches": len(involved),
                      "clubMatchAppearances": metadata["clubMatchAppearances"], "clubs": len(clubs),
                      "sourceFiles": len(source_details), "gaps": gaps, "resultsSha256": results_sha}, ensure_ascii=True))
    for club_id, item in clubs.items():
        print(f"{club_id}: {item['matches']} matches, W/D/L {item['wins']}/{item['draws']}/{item['losses']}, GF/GA {item['goalsFor']}/{item['goalsAgainst']}")
    if gaps:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
