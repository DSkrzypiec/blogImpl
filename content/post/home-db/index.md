---
date: "2020-11-11"
tags: ["database"]
title: "Home Database"
toc: true
draft: false
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
computers) directly. Mostly because it is very personal and sensitive. On other hand it
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
case I can fill the forms directly on my smartphone.

In the moment of writing this post repo with source code of *Home App* is
private but I might make it public someday.


## Data uploading

Till this point I've setup SQLite database and connected web app for uploading
and accessing data. So now I could focus on actually using the *Home App* to
populate *Home DB*.

Regarding water and energy usage in home I manually check water counter and
energy counter at evening every fifth day. I think it's a good middle ground.
Daily basis wouldn't be possible and monthly basis would be rather too rarely.

Regarding financial transactions. Once a month I download XML with all
transactions from my bank. Part of *Home App* parses and uploads this XML into
appropriate table in the DB. Only manual work here is to download XML once a
month which doesn't seems like a problem. Maybe one day there will be API for
that? I hope so.

Digitalization of documents is for sure the most time-consuming part of
uploading data. In most cases I have to scan actual physical paper sheets. When
I've discovered there are tiny scanners I immediately bought one:

![img](scanner.gif)

On evening when scanner arrived I've scanned around 35 documents. There is
still many more but even after this sample I felt it was a very good choice.
It'll probably took me at least few evening to scan significant documents but
once that will be done keeping up with new ones will not require much effort.

![img](upload.png)


## Security and backups

As I stated before security is one of most crucial aspects of this project. I
could do local backups on my HD and SSD drives but preferably I'd like to have
safe backups on the Web to be able to reach for those outside my home or even
on new device. If only there would be some safe and anonymous way to do online
backups...

Fortunately there is [Tarsnap](https://www.tarsnap.com/) - *"Online
backups for the truly paranoid"* by Dr. Colin Percival. It's a tool for secure
and efficient online backups. Tarsnap security is based on *key file* which is
generated during account setup. Only person with that key file can access your
backups. The key file is generated locally on the client's device. Therefore
even Tarsnap cannot restore your backups in case when you lost your key file.
It uses very strong encryption, details can be read
[here](https://www.tarsnap.com/crypto.html). It also a have cool feature which
is deduplication. Only new bytes in comparison to previous backup are
compressed, encrypted and send onto servers.

Tarsnap works under UNIX-like OS. On my main PC I use Linux so everything went
smooth. I've tested it also on my Windows Laptop using Windows Subsystem for
Linux and Ubuntu 20 to configure Tarsnap. Once again there wasn't any problems.
Note that on the Windows box I had to put my original key file from my main PC.
Generating new key would create a new namespace for backups even under the same
Tarsnap account.

Besides secure backups *Home App* is hosted on my local (home) network and also
authentication is setup. So even someone would get into my network during
application is listening then he/she have to also hack the *Home App*. That is
very unlikely.

Even if someone would steal my main PC and brute force my password and finally
get hands on my personal data that is still better then stealing my physical
documents. Backup can be restored with no cost. "Restoring" physical documents
wouldn't probably be possible in many cases without having *Home DB*.


## Summary

Having **Home DB** makes me feel secure and be in control of my personal
data. It's priceless.
The power of querying through several years of your personal finance or
browsing through specific kind of invoices effortlessly without need to go
through sorting physical folders and papers is amazing. It was definitely worth
the effort to put together the database and the app.

Probably next steps would be to extend data scheme and introduce data analytic
and visualization layer into *Home App*. As I said it is a life-long project of
storing and analyzing my and my family data. I'm sure there would be plenty
improvements and extensions. I will probably write another post someday on
this.

I'm very excited about this project. I find this idea (digitalization of
personal data and assets) very attractive. I wonder if there is a market for
this kind of service (not a product, but whole service)? But this is for another time.

