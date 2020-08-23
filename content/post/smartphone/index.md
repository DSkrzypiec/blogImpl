---
date: "2020-08-23"
tags: ["Android", "Go"]
title: "Writing a blog on smartphone"
draft: true
markup: "mmark"
---

![img](postVimTermux.jpg)

## Intro
Nowadays smartphones are basically a pocket computers. Smartphone hardware
evolution is very rapid. I was in a situation where my middle-tier phone was
better than my current laptop. Could smartphone be used for programming in that
case? The answer is *yes* but is it actual feasible? In this post we'll focus on
implementing a blog on a Android smartphone.

## Setup

My main development environment on Android phone is Termux application which is
a terminal emulator with Linux environment. I do really love it.
I'm (and most of Android phones are) on Android OS using ARM architecture CPU.
So we can use any program and programming language which is compatible with
this OS and architecture.

In term of technological stack I've selected the same which is used by this blog -
[Hugo](https://gohugo.io/).

To prepare Termux for writing a blog on our smartphone we'll need to install:
* **git** for communicating with outside World
{{< cmd >}} pkg install git {{< /cmd >}}

* **Go** programming language 
{{< cmd >}} pkg install golang {{< /cmd >}}

In order to use Hugo we'll compile it from the source code. Hugo is written in
Go so it'll be a one-liner.

* Clone repo with Hugo source code
{{< cmd >}} git clone https://github.com/gohugoio/hugo {{< /cmd >}}

* Go to the repo and compile Hugo
{{< cmd >}} 
cd hugo && go build -v
{{< /cmd >}}

Go compiler will fetch and compile all of required dependencies. For
convenience add Hugo to your path. One way to do that is add the following line
in your `.bashrc` file (on Termux you might have to create `~/.bashrc`)

{{< cmd >}} 
PATH=$PATH:~/your/path/to/hugo
{{< /cmd >}}

After extending your `PATH` you'll need to restart Termux or run
`termux-reload-settings`.


![img](versions.jpg)

## Workflow

After the setup we're ready to write a blog and use Hugo to generate source
code into actual website. I'd recommend to do [initial
setup](https://gohugo.io/getting-started/quick-start/) of Hugo project on
actual PC or laptop. In my case I've configured the project and I've put it on
my GitHub. Next using git I've cloned the project into Termux on my smartphone.
Now I'm ready to edit or create content of my blog. To do that you'll have to
use one of terminal-based text editor. I use vim. Once the content is ready you
can compile your blog and preview it in your browser on your phone!

![img](hugoServer.jpg)

Compilation is done by running `hugo server -D` inside top level catalog of
your blog source code. Next we can jump into our browser on default local address
*http://localhost:1313/*.

![img](compiled.jpg)

## Conclusions

## References

1. [Termux](https://termux.com/)
2. [Hugo]()
3. [Hugo
