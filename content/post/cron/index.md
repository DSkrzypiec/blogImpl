---
date: "2024-04-19"
tags: ["data-engineering", "Go"]
title: "Implementing cron"
toc: false
draft: false
---


## Intro

Recently I've been writing down documentation for [ppacer
schedules](https://ppacer.org/internals/schedules/) and in that moment I
thought I should have probably implemented cron schedule for ppacer. Before I
explain why I thought that, let's take one step back first, to give you a bit
of context about ppacer schedules. Schedules in ppacer are covered by generic
and simple interface


```
type Schedule interface {
    Start() time.Time
    Next(curentTime time.Time, prevSchedule *time.Time) time.Time
    String() string
}
```

Initially I've provided the simplest possible regular schedule which satisfies
that interface -
`schedule.Fixed`([docs](https://pkg.go.dev/github.com/ppacer/core/dag/schedule#Fixed))
which starts at given time and ticks each given `time.Duration` (e.g. `10 *
time.Minute`). That was definitely good enough for the first ppacer backed
versions and tests.

I thought having a generic interface for schedules and providing simple
concrete implementation would be enough for the MVP ppacer version, but then
when I was writing docs on this topic I thought it would be great to also cover
cron. Why? There are few reasons. Cron is classic and influential scheduler
from *-UNIX world. Cron expressions became so common that they are popping out
not only in modern schedulers but also in business applications. I felt a bit
obligated, to support cron expressions, since I'm implementing my own scheduler.
Also I thought it might be quick and interesting tangent to my project. It
wasn't really quick, but it was interesting.


## cron 101

Let me start by quickly introducing cron. Cron is a command-line program on
Unix-like systems for scheduling jobs. Cron job can be added, listed or deleted
using `crontab` program. Usually when we want to add new job, we need to
specify a schedule for that job and what action needs to be performed. This
definition looks like this:


```
# Example of job definition:
# .---------------- minute (0 - 59)
# |  .------------- hour (0 - 23)
# |  |  .---------- day of month (1 - 31)
# |  |  |  .------- month (1 - 12) OR jan,feb,mar,apr ...
# |  |  |  |  .---- day of week (0 - 6) (Sunday=0 or 7)
# |  |  |  |  |
# *  *  *  *  * user-name command to be executed
17 * * * *      root    cd / && run-parts --report /etc/cron.hourly
```

In the example above we can see that there is only one cron job defined. It
runs on schedule `17 * * * *` (at 17th minute of every hour, every day),
should be performed as user `root` and should execute bash command


```
cd / && run-parts --report /etc/cron.hourly
```

We can say that cron is a Linux (daemon) process which runs in the background,
wakes up once a minute, reads its database (`crontab` file), checks if given
jobs should be executed based on current time and job cron expression, if
that's the case it executes job's command or script.

Cron is still used nowadays mainly because it's available on every *-UNIX OS
I've ever touched and it's very easy to setup. If you need to run rather simple
task on a schedule and you're on Linux, it might be good choice. There's also a
downside. It's so simple that it lacks monitoring and alerting for cases when
job fails.


## cron history

Cron has been introduced as command utility program in Version 7 UNIX in 1979.
That version was implemented by Ken Thompson. Initially it was just `cron`
program without, mentioned earlier, `crontab`. Jobs by default were stored in
`/usr/lib/crontab`.

When it comes to Linux, most distribution uses cron implementation done by Paul
Vixie or their own version created based on "Vixie cron". That cron version was
implemented by Paul in 1988 with another releases in 1990, 1993, 1994.

Over the last two decades cron and cron expressions for schedules became a
standard for expressing regular intervals or schedules in just a few
characters. Most (if not every) mainstream programming languages has at least
one library which helps parsing cron expressions and use it in your
application. Few examples of such libraries:

* [croniter](https://github.com/kiorky/croniter) - Python library which
  provides iterator for the datetime object with a cron like format. Apache
  Airflow uses this library.
* [node-cron](https://www.npmjs.com/package/node-cron) - JavaScript module
  which implements tiny task scheduler supporting crontab syntax.
* [NCrontab](https://github.com/atifaziz/NCrontab) - C# library for parsing
  crontab expressions and calculating schedule based on those expressions.
* [cron](https://docs.rs/cron/latest/cron/) Rust crate - "A cron expression
  parser and schedule explorer".

There's event classic [crontab.guru](https://crontab.guru) which can help
learning cron expressions syntax or just help to prepare syntax for desired
schedule, so you can forget about it few minutes later.

What I meant presenting those examples is the fact that cron and crontab
expressions has gone mainstream for over 20-30 years regarding defining simple,
yet effective schedules, not only in cron itself.


## HOW TO CALL THIS CHAPTER?

When I was about to start implementing something on my own regarding cron, I
looked at the Vixie cron implementation and I found the following comment:

```
/* the dom/dow situation is odd.  '* * 1,15 * Sun' will run on the
 * first and fifteenth AND every Sunday;  '* * * * Sun' will run *only*
 * on Sundays;  '* * 1,15 * *' will run *only* the 1st and 15th.  this
 * is why we keep 'e->dow_star' and 'e->dom_star'.  yes, it's bizarre.
 * like many bizarre things, it's the standard.
 */
```

So when you have `0 10 13 * 1` cron expression for your schedule

## 


## Summary

TODO

## References

1. [Cron Wikipedia](https://en.wikipedia.org/wiki/Cron)
1. [Version 7 UNIX (mirror)
   cron](https://github.com/v7unix/v7unix/blob/a19130f05356581fe12d635a4cce4d8556a33171/v7/usr/src/cmd/cron.c)
1. [Paul Vixie cron in
   Debian](https://salsa.debian.org/debian/cron/-/blob/master/cron.c?ref_type=heads)
1. [Quora post with screenshot of email from Brian
   Kernighan](https://www.quora.com/What-is-the-etymology-of-cron/answer/Kah-Seng-Tay)
1.
