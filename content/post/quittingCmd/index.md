---
date: "2020-08-05"
tags: ["Windows", "cmd", "PowerShell"]
title: "I'm quitting cmd"
draft: false
markup: "mmark"
---

## Background

Regarding operating systems I prefer Linux over Windows. Even though in my job
I'm forced to use Windows. To make my work on Windows more pleasant I've been 
using Command-line alongside with vim, grep, AWK and other Unix/Linux tools.

Using cmd before Windows 10 was not a very visual appealing experience. It
suppose to be just a rectangle box with a text and somehow they made it hard to
read and write text. In Windows 10 cmd was visually improved. It started to
look modern and more like other Linux terminals.

For the last five years I've been using Command-line on Windows 10. 
So what suddenly have changed my mind? PowerShell. 

I always have been conscious that PowerShell exists but I've never give it a
try. Why? To be honest because of it's horrible default dark blue background color.
Recently I've got a task to extend some PowerShell script and I found out it's a great
tool! And also I've configured [ConEmu](https://conemu.github.io/) to use
PowerShell as a default shell with the same appearance as cmd (black
background and white JetBrains mono). That was the beginning of new chapter of my
life.


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

In traditional shells usual output from program is just text which can be input
to another program which will produce another text output and so on. In this
environment very common is combination of programs like grep, AWK and sed 
to deal with those streams of text.

PowerShell on contrary is object-based. Output of standard PowerShell utilities
are .NET objects. To access object's properties and methods dot notation is
used. 

{{% code %}}
$fileList = ls
$file5 = $fileList[5]
Write-Host "File" $file5.FullName "was created" $file5.CreationTime
{{% /code %}}

In the above example we've created `$fileList` (dollar sign have to precede
variable name) which is an array of objects representing files. It's not an
array of strings. It's an array of actual objects representing files. Next we
defined `$file5` which is an object representing 6th element of `ls`. Formally
`$file5` is of type `FileInfo` and have about fifty properties and methods. For
example `FullName` and `CreationTime` properties which we used to print custom
message but also methods like `$file5.Open()` which returns
`System.IO.FileStream` which is regular .NET object representing a file stream.
For C#, F# or VB programmers it's a very good news.

{{% code %}}
ls -Recurse *.go | Where-Object {$_.CreationTime -ge '2020-07-25'}
{{% /code %}}

Another example displays how expressive it can be. This particular example
lists all of files with `.go` extension from all sub-catalogs which was created
after `2020-07-25`. Notation `$_` represents current value in the pipeline.


### Integration with .NET
PowerShell is built on top of .NET thus integration with .NET is natural.
Why that matters? For instance we can use C# standard libraries from
PowerShell:

{{% code %}}
$rand = [System.Random]::new()
$rand.Next(10, 100)
{{% /code %}}

We just used standard C# `System.Random.Random` object to generate pseudorandom
integers. How cool is that? In particular you can use your C# functionalities
for scripting! Sometimes that might be useful.

Another point is that you can define your own PowerShell cmdlets written in C#
or F#.


### Tab completion
PowerShell have a very good tab completion in comparison to cmd. 

### Aliases
PowerShell on default configuration have a very broad set of aliases for native
functionalities. We have already seen `ls` "command". In fact `ls` is just an
alias for `Get-ChildItem` cmdlet. Besides `ls` it has predefined other aliases -
`gci` and `dir`. So both Linux and Windows cmd users won't have trouble to get
a list of elements in given location. We can easy add new aliases for
existing cmdlets using `Set-Alias` cmdlet.

There is one more advantage of having full name cmdlets and their aliases. When
you're writing a PowerShell script you can use full name to increase
readability and when you're just fooling around in terminal you can just use
aliases for compactness and laziness of typing.

{{< blockquote author="Microsoft Docs" >}}
A cmdlet is a lightweight command that is used in the PowerShell environment. 
The PowerShell runtime invokes these cmdlets within the context of automation 
scripts that are provided at the command line.
{{< /blockquote >}}


## Transition to PowerShell

Transition from Windows Command-line to PowerShell was very easy! Taking into
account aliases and rather good (better then cmd) built-in help I've replaced
cmd with PowerShell in one day. Without any effort! All of programs I've been
using in cmd works without any difference in PowerShell. And what is most
important now I feel that Windows is under my control and not the other way.
More like on Linux. I very like that.

I've basically just started my journey with PowerShell but I'm sure that it
will continue as long as I'll be forced to use Windows.


## Summary

If you're Windows user or you're forced to use Windows and you want to get near
Linux-like experience using terminal then go for PowerShell. Transition is
effortless and you can easily change horrible default dark blue background
color. And final gain is massive, especially if you're already a .NET developer.
I think it is already one of my better choices regarding tooling, right after vim
and AWK (not mentioning git which is obligatory nowadays).


## References

1. [What is PoweShell](https://docs.microsoft.com/en-us/powershell/scripting/overview?view=powershell-7)
2. [Wiki](https://en.wikipedia.org/wiki/PowerShell)
3. [Brian Kernighan interviews Ken Thompson](https://www.youtube.com/watch?v=EY6q5dv_B-o)
4. [Cmdlet overview](https://docs.microsoft.com/en-us/powershell/scripting/developer/cmdlet/cmdlet-overview?view=powershell-7)

