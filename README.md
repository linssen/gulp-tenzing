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
        <a href="#{{slug}}">{{title}}</a>
    {{/each}}
</nav>

<nav class="GroupList">
    {{#each groups}}
        {{title}}<br>
    {{/each}}
</nav>

{{#each components}}
    <div id="{{slug}}" class="Group-{{group.slug}}">
        <h2>{{title}}</h2>
        {{{details}}}
        <pre><code>{{{code}}}</code></pre>
        {{{rendered}}}
    </div>
{{/each}}
```

So assuming you have one component `button.html` that looks like this:

```html
---
title: Button
group: Forms
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

<div>
    <h2>Button</h2>
    This is a <em>nice</em> <code>button</code>.
    <pre><code>&lt;button class="button-primary"&gt;action&lt;/button&gt;</code></pre>
    <button class="button--primary">Action</button>
</div>
```

It's all configurable, and I need to improve this readme.