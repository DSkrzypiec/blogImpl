---
date: "2021-11-01"
tags: ["Vim"]
title: "Fuzzy Finder"
toc: false
draft: false
---

![img](top.png)

## Intro

I'll start by stating that I don't like fuzziness. It's the main reason I
didn't stick to machine learning and data science at the beginning of my
career. Instead I've transitioned to programming and data engineering.

And here I am writing about _fuzzy_ finder in Vim. That's because of
[fzf.vim](https://github.com/junegunn/fzf.vim) Vim package. It has some very
convenient feature that I have been looking for. More on this later in the
post. I still believe you should know (at least try to know) file tree
structure of a project your working on. Fuzzy finders might pull you away from
this practice very quickly. And I do think it's a bad idea.

However let's assume you have a firm grasp of your project's structure tree but
it's large project with very deep tree. In this case, when you know what you
are looking for, it might saves you time for typing long file paths.

Before I jump to _fzf.vim_ package let's discuss [fzf](https://github.com/junegunn/fzf)
first.


## _fzf_

Fuzzy finders in general helps you to look for a file or directory, usually in
an interactive manner, by just taking search phrases. They are usually search
down the tree of files recursively beginning from current catalog.

At I stated before I try to know the file tree. But in case I want to open file
in `./this/very/deep/file/path/location/project/sub/MyFile.cs` it is really
convenient to feed `MyFile` phrase to fuzzy finder to quickly go to that
location.

In case of _fzf_ I mostly use two aliases which uses _fzf_ to fuzzy find file
and open it in Vim and the other one is for jumping to found directory.


```
alias vf='vim $(fzf --height 40%)'
alias cdf='cd $(find . -type directory | fzf --height 60%)'
```
A little demo of the those aliases:
[![asciicast](https://asciinema.org/a/hTYFpnEqIekVYmTV7c1xS9PCk.svg)](https://asciinema.org/a/hTYFpnEqIekVYmTV7c1xS9PCk)


## _fzf.vim_

As the name suggests _fzf.vim_ is a Vim package which wraps _fzf_ in very comfy
form. It takes advantage of Vim pop-up windows to run _fzf_. It can perform
fuzzy search on files, git commits, Vim help, snippets and many more.
But what was the most crucial feature for me was integration of _fzf_ with
[ripgrep](https://github.com/BurntSushi/ripgrep).

For years I've been using the following mapping for using grep while working in
Vim (I used spaces instead of `<space>` for readability) to grep the word under
the cursor

```
noremap <leader>f :!grep --color=always -iran <C-r><C-w> .<CR>
```

Once I've glanced over the grep result I had to manually open the desired file.
It was a bit tedious.

Using _fzf.vim_ I can use `:Rg` command to use `ripgrep` interactively and
preview fragment of files for matched results. Because of great performance of
both _ripgrep_ and _fzf_ browsing through results is extremely smooth.
Once you find a result you can open it in new tab (`Ctrl + t`), new split
(`Ctrl + x`) or vertical split (`Ctrl + v`).

The following cast should express more than few paragraphs.

[![asciicast](https://asciinema.org/a/9qVzlU7SRLzvipfivYANQjZB7.svg)](https://asciinema.org/a/9qVzlU7SRLzvipfivYANQjZB7)

There is one technical caveat in `:Rg` command. The ripgrep query is performed
once at the beginning and all filters on results are done by _fzf_. Therefore
you might think that using regular expressions doesn't work. Fortunately author
gives [an
example](https://github.com/junegunn/fzf.vim#example-advanced-ripgrep-integration)
how to fire up _ripgrep_ on every query change. I have set this under `:RB`
command.


## My settings

Make sure you have _fzf_ and _ripgrep_ installed before setting up Vim plugins.


```
Plugin 'junegunn/fzf'
Plugin 'junegunn/fzf.vim'
...

let g:fzf_preview_window = ['down:40%', 'ctrl-/']

function! RipgrepFzf(query, fullscreen)
  let command_fmt = 'rg --line-number --no-heading --color=always -- %s || true'
  let initial_command = printf(command_fmt, shellescape(a:query))
  let reload_command = printf(command_fmt, '{q}')
  let spec = {'options': ['--phony', '--query', a:query, '--bind', 'change:reload:'.reload_command]}
  call fzf#vim#grep(initial_command, 1, fzf#vim#with_preview(spec), a:fullscreen)
endfunction

command! -nargs=* -bang RG call RipgrepFzf(<q-args>, <bang>0)
```

## Summary

In a very long time I have not been this excited about Vim plugin. Regular
fuzzy finder for files via _fzf.vim_ is a pleasant feature but if it would be
the only feature of this plugin I would stick with standard Vim's `find`.

But using this smooth usage of _ripgrep_ inside Vim has really light a spark of
joy for me. That is it. It is the main reason for this post.


## References

1. [fzf](https://github.com/junegunn/fzf)
2. [fzf.vim](https://github.com/junegunn/fzf.vim)
3. [ripgrep](https://github.com/BurntSushi/ripgrep)

