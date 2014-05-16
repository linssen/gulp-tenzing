# Gulp Tenzing

[![Build Status](https://travis-ci.org/linssen/gulp-tenzing.svg)](https://travis-ci.org/linssen/gulp-tenzing)

## A front end style guide generator with no opinions

### Installation


```bash
$ npm install gulp-tenzing
```

### Usage

Put each of your html components in a directory, and the plugin will pull them out, read out the front YAML and build a directory of all of them according to the layouts you provide.

Layouts and components are just Handlebars templates, so you can ignore or use it's logic as you wish. A minimal layout would look like this:

```html
<h1>Components</h1>
<nav class="ComponentList">
    {{#each components}}
        <a href="#cmp-{{slug}}">{{title}}</a>
    {{/each}}
</nav>

<nav class="GroupList">
    {{#each groups}}
        <a href="#grp-{{slug}}">{{title}}</a><br>
    {{/each}}
</nav>

{{#each groups}}
    <div id="grp-{{slug}}" class="Group">
        <h2>{{title}}</h2>
        {{#each components}}
            <div id="cmp-{{slug}}" class="Component">
                <h3>{{#if title}}{{title}}{{else}}{{slug}}{{/if}}</h3>
                <div class="Component-rendered">
                    {{{code}}}
                </div>
                <pre><code>{{code}}</code></pre>
            </div>
        {{/each}}
    </div>
{{/each}}
```

So assuming you have one component `Forms/button.html` that looks like this:

```html
---
title: Button
details: |
    This is a _nice_ `button`
---
<button class="button--primary">Action</button>
```

You'll get

```html
<h1>Components</h1>
<nav>
    <a href="#button">Button</a>
</nav>

<nav class="GroupList">
    Forms<br>
</nav>

<div id="grp-forms" class="Group">
    <h2>Forms</h2>
    <div id="cmp-button">
        <h3>Button</h3>
        This is a <em>nice</em> <code>button</code>.
        <div class="Component-rendered">
            <button class="button--primary">Action</button>
        </div>
        <pre><code>&lt;button class="button-primary"&gt;action&lt;/button&gt;</code></pre>
    </div>
</div>
```

It's all configurable, and I need to improve this readme.