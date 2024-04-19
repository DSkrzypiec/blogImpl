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
thought I should have probably implement cron schedule for ppacer. Before I
explain why I thought that, let's take one step back first, to give a bit of
context about ppacer schedules. Schedules in ppacer are covered behind generic
and simple Go interface


```
type Schedule interface {
    Start() time.Time
    Next(curentTime time.Time, prevSchedule *time.Time) time.Time
    String() string
}
```

Initially I've provided the simplest possible regular schedule which satisfies
that interface - `schedule.Fixed` which starts at given time and ticks each
given `time.Duration` (e.g. `10 * time.Minute`). That was definitely good
enough for the first ppacer backed versions and tests.

I thought having a generic interface for schedules and providing simple
concrete implementation would be enough for the MVP ppacer version, but then
when I was writing docs on this topic I thought it would be great to also cover
cron. Why? There are few reasons. Cron is classic and influential scheduler
from *-UNIX world. Cron expressions became so common that they are popping out
not only in modern schedulers but also in business applications. I felt a bit
obliged, to support cron expressions, since I'm implementing my own scheduler.
Also I thought it might be quick and interesting tangent to my project. It
wasn't really quick, but it was interesting.


## TODO


## Summary

TODO

