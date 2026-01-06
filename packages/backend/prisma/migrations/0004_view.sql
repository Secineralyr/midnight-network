create view UserParticipantsCount as
  select userId, count(*) as participantsCount
    from Record
    group by userId;

create view WinCount as
  select userId, count(*) as winCount
    from Record
    where place = 1
    group by userId;

create view WinRate as
  select a.userId as userId, cast(winCount as real)/cast(participantsCount as real) as wr
    from UserParticipantsCount as a join WinCount as b on a.userId = b.userId;

create view ParticipantsPerMatch as
  select a.id as matchDateId, count(*) as participantsCount
    from MatchDate as a left join Record as b on a.id = b.matchDateId
    group by a.id;

create view PlacePerParticipantsPerMatchRate as
  select a.id as recordId, cast(a.place as real)/cast(b.participantsCount as real) as placeRate
    from Record as a right join ParticipantsPerMatch as b on a.matchDateId = b.matchDateId
    where a.place > 0;

create view PlacePerParticipantsPerMatchRateAvg as
  select a.userId as userId, avg(b.placeRate) as placeRateAvg
    from Record as a join PlacePerParticipantsPerMatchRate as b on a.id = b.recordId
    group by a.userId;

create view DeltaTimeMs as
  select a.id as recordId,
    cast(unixepoch(a.postedAt, 'subsec') * 1000 as integer) -
    cast(unixepoch(b.date, 'subsec') * 1000 as integer)
  as dt
    from Record as a right join MatchDate as b on a.matchDateId = b.id;

create view DeltaTimeMsAvg as
  select a.userId as userId, avg(b.dt) as dtAvg
    from Record as a join DeltaTimeMs as b on a.id = b.recordId
    where b.dt >= 0
    group by a.userId;

create view EarlyLateTime as
  select a.userId as userId, max(b.dt) as lateTime, min(b.dt) as earlyTime
    from Record as a join DeltaTimeMs as b on a.id = b.recordId
    where b.dt >= 0
    group by a.userId;

create view UserFlyingCount as
  select userId, count(*) as flyingCount
    from Record
    where place < 0
    group by userId;

create view UserWithinCount as
  select userId, count(*) as withinCount
    from Record
    where place between 1 and 10
    group by userId;

create view MatchUserMedian as
with tmp as (
    select
        participantsCount,
        row_number() over (order by participantsCount) as no,
        count(*) over () as total
    from ParticipantsPerMatch
)
select AVG(participantsCount) as med
from tmp
where no in ((total + 1) / 2, (total + 2) / 2);

create view UserAveragePlace as
  select userId, placeRateAvg*(select * from MatchUserMedian)+1 as averagePlace
    from PlacePerParticipantsPerMatchRateAvg
    group by userId;

create view UserMaxPlace as
  select userId, min(place) as maxPlace
    from Record
    where place > 0
    group by userId;

create view RadarStatsAvg as
  with RadarStats as (
  select urs.id as userId, urs.pt as totalPt, participantsCount as totalParticipationCount, dtAvg as averageTime, averagePlace, wr
  from
    UserRankStatus as urs
    join
    UserAveragePlace as uap
    on urs.id = uap.userId
    join
    DeltaTimeMsAvg as dtma
    on urs.id = dtma.userId
    join
    UserFlyingCount as ufc
    on urs.id = ufc.userId
    join
    UserParticipantsCount as upc
    on urs.id = upc.userId
    join
    WinRate as uwr
    on urs.id = uwr.userId
)
  select avg(totalPt) as totalPtMean,
    avg(totalParticipationCount) as totalParticipationCountMean,
    avg(averageTime) as averageTimeMean,
    avg(averagePlace) as averagePlaceMean,
    avg(wr) as wrMean,
	sqrt(avg(totalPt * totalPt) - avg(totalPt) * avg(totalPt)) as totalPtStd,
	sqrt(avg(totalParticipationCount * totalParticipationCount) - avg(totalParticipationCount) * avg(totalParticipationCount)) as totalParticipationCountStd,
    sqrt(avg(averageTime * averageTime) - avg(averageTime) * avg(averageTime)) as averageTimeStd,
    sqrt(avg(averagePlace * averagePlace) - avg(averagePlace) * avg(averagePlace)) as averagePlaceStd,
    sqrt(avg(wr * wr) - avg(wr) * avg(wr)) as wrStd
    from RadarStats;
