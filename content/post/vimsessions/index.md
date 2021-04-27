---
date: "2021-04-27"
tags: ["vim"]
title: "Vim sessions"
toc: false
draft: false
---

![img](vimSession.gif)

# Intro

I wanted to share with you my experience with Vim sessions. The concept and
usage are really simple but I didn't know about it for a long time using Vim.
In a nutshell you can save current state of your Vim environment as a
_session_. Once it's saved it can be reopened.

Have you ever been debugging (not necessarily in Vim) for few hours with bunch of
files opened in particular order to wrap your head around the problem? Finally
you built up enough understanding to solve the bug and with relief you close
those dozens of tabs and windows. Few months passes and another bug have
occurred in this area. What now? In best case you _remember_ logic and order of
execution in this particular area from fixing a bug few months back and it's not
a problem now. From my experience this is very rare case especially on large
projects and more common case is that you start analyzing this area once again
from the top. It might be a bit faster this time but still takes time and
what most important takes a lot of brain power and focus.

My answer to this are Vim sessions.


# Vim sessions

Creating a session is rather straightforward by using single ex command:

```
:mks[ession][!] sessionFileName.vim
```

This command should be called at the moment when you want to capture your
current vim state. Version with exclamation mark overrides given file.
Sessions keeps track of many things but most important to me are

* Order of tabs and windows
* All mappings and macros
* Buffers

More details can be found in `:help mks`.
Vim session can be restored using `:source` ex command:

```
:so[urce] sessionFileName.vim
```

Usually I have a single catalog per project with vim sessions. After a while on
new project I can very fast recreate development or debug environment for
particular areas of the project.


The following screen cast presents example of loading saved session twice.

[![asciicast](https://asciinema.org/a/E3S18mOqyrD74SdHhJAtjubVu.svg)](https://asciinema.org/a/E3S18mOqyrD74SdHhJAtjubVu)


# Summary

Opening last session is a default in probably all IDEs nowadays but saving session
to a file is no so common. For me it was a huge help, especially on a large
projects. Keeping vim sessions saved let me power through the project in no
time. I don't waste time to think about which files should I open, then find
files and finally open. I just pick right session saved from my catalog and
start from there. It seems like a little thing (and in fact it is) but it
improved my daily workflow significantly.

