---
date: "2020-08-04"
tags: ["Windows", "cmd", "PowerShell"]
title: "I'm quitting cmd"
draft: true
markup: "mmark"
---

## Background
Regarding operating systems I prefer Linux over Windows. Even though in my job I
have to use Windows. To make my work on Windows more pleasant I've been 
using Command-line with vim, grep, AWK and other Unix/Linux tools.

Using cmd before Windows 10 was not a very visual appealing experience. It
suppose to be just a rectangle box with a text and somehow they made it hard to
read and write text. In Windows 10 cmd was visually improved. It started to
look modern and more like other Linux terminals.

For the last five years I've been using Command-line on Windows 10. 
So what suddenly have changed my mind? PowerShell. 

I always have been conscious that PowerShell exists but I've never give it a
try. Why? To be honest because of it's horrible default dark blue screen color.
Recently I had to extend some PowerShell script and I found out it's a great
tool! And also I've configured [ConEmu](https://conemu.github.io/) to use
PowerShell as a default shell with the same appearance as previously cmd was
setup.


## What is PowerShell?

PowerShell is a framework from Microsoft consisting of scripting language and
command-line shell built on top of .NET CLR. In 2016 PowerShell was moved to
.NET Core which made it cross-platform and moreover it was open-sourced in
August 2016 (under name PowerShell Core).

So basically it's a better command-line (not only) for Windows. How better?
Let's find out.


## Benefits of PowerShell over cmd

Here I've selected top features of PowerShell which in my opinion make it
superior to standard cmd.

### Pipes

For me most pain from using cmd comes from absence of Unix-like pipes. Unix
pipe is an operator "|" (ASCII 124) and it takes an output of the previous
process and treats it as input to the current process. It's a basis of Unix
philosophy of composing programs introduced and implemented by Douglas Mcllroy
and Ken Thompson around 1973 in Bell Labs. PowerShell got them!

{{% code %}}
ls -Recurse *.txt | Get-Content | Measure -l -w -c
{{% /code %}}

The example above get a list of all text files from all sub-catalogs, get their
content and finally count number of lines, words and characters.

### Object-based 
TODO:

{{% code %}}
ls -Recurse *.go | Where-Object {$_.CreationTime -ge '2020-07-25'}
{{% /code %}}

### Integration with .NET

### Tab completion

### Aliases

## Transition to PowerShell

## Samples from PowerShell

## Summary


## Bibliography

1. [What is PoweShell](https://docs.microsoft.com/en-us/powershell/scripting/overview?view=powershell-7)
2. [Wiki](https://en.wikipedia.org/wiki/PowerShell)
3. [Brian Kernighan interviews Ken Thompson](https://www.youtube.com/watch?v=EY6q5dv_B-o)
4. [asdasd](asdd)

