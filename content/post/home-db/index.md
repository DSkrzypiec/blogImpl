---
date: "2020-11-08"
tags: ["database"]
title: "Home Database"
toc: true
draft: true
---

## Intro

Last month after my daughter was born we've received a bunch
of documents in this matter. Birth certificate, medical papers,
assignment of [PESEL](https://en.wikipedia.org/wiki/PESEL),
etc. When I was about to put those papers into document folders
I thought it's time for digitalization.

Most of our very important documents like mortgage papers or university
diplomas exist only in physical version without any copy either digital or
physical. We had plans to scan or at least make photos of those but we
didn't do it. Therefore I thought let's make this right this time.

Besides documents, in so-called *Home App* I would also want to keep track of
usage of water and energy in our home, bank transactions history and list
of our books.


## The database

I don't want to store this kind of data on the cloud (someone else's
computers). Mostly because it is very personal and sensitive. On other hand it
happens that Google disable accounts without prior notice. Thus I want to build
something locally, in my internal network, with safe external backups.

I want my **home DB**, yet abstract bag for home data, to be:

* in form of a single file
* accessible on multiply platforms and devices
* structured
* free

Based on those criteria I choose [SQLite](https://www.sqlite.org/index.html).
It works everywhere, it can store files in a raw format (blob), it's
self-contained, it's free and it's probably
[the most tested](https://news.ycombinator.com/item?id=18685748)
non-trivial program ever written. I also personally like SQLite for being
minimalistic. Setup is trivial or even nonexistent.

Finally I'll be having a single database file
containing all of my and my family important files from our adult life.
That sounds serious. We'll back to that in *Security* section.

Wait... But how can I upload my files and data to this database? Yep, I'm also
developing **Home App**.


## Home App

![img](documents.png)

Still the main "product" of this life-long project is the database but to make
it more comfortable to operate on this DB I need some kind of application.
I have decided to build a web application which would run on my local network.
I choose
[ASP.NET Core MVC](https://docs.microsoft.com/en-us/aspnet/core/tutorials/first-mvc-app/start-mvc?view=aspnetcore-3.1&tabs=visual-studio)
(C#) over Go because all SQL drivers for SQLite in Go
uses *cgo*.

As you can see above I'm not focused much on the UI side. Maybe someday but not
in foreseeable future. Main goals for this app is to ensure data insertion
layer both for documents (files) and other data. Secondly to give a quick view
on data. For example if I want to check my diploma from high school I should be
able to do it quickly through the UI.

It doesn't need to be a complete application with coverage of all
functionalities and corner cases. This application will be used literally by
1-4 users in local network. If something throw exception I could quickly pick
it up. It sounds like very comfortable assumptions for developer and in fact it
is. That made it possible for me to implement most of functionalities in couple
of evenings.

MVC over Go have one more advantage for me. It has already bootstrap setup so
this application is also usable from my mobile phone without any extra effort.
For someone who avoid frontend technologies it was significant advantage.
It's useful when I go to the hall to check my water and energy usage. In this
case I can fill the form directly on my phone to submit it to the database.

In the moment of writing this post repo with source code of *Home App* is
private but I might make it public someday.


## Data uploading

![img](scanner.gif)

![img](upload.png)

## Security and backups

## Summary

