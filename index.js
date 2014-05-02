'use strict';

var Buffer, fs, gutil, Handlebars, marked, path, through, yamlFront;

Buffer = require('buffer').Buffer;
fs = require('fs');
gutil = require('gulp-util');
Handlebars = require('handlebars');
marked = require('marked');
path = require('path');
through = require('through');
yamlFront = require('yaml-front-matter');

module.exports = function (options) {
    var buildComponent, buildLayouts, buildLayout, components, groups, slugify;

    options = options || {layoutsPath: './layouts/templates'};
    components = [];
    groups = {};

    slugify = function (str) {
        // Many thanks to underscore.string.js for this
        // https://github.com/epeli/underscore.string
        var from, regex, to;

        if (str === null) { return ''; }

        from = 'ąàáäâãåæăćęèéëêìíïîłńòóöôõøśșțùúüûñçżź';
        to = 'aaaaaaaaaceeeeeiiiilnoooooosstuuuunczz';

        regex = new RegExp('[' + from + ']');
        str = String(str)
            .toLowerCase()
            .replace(/\.html$/, '')
            .replace(regex, function (c) {
                var index = from.indexOf(c);
                return to.charAt(index)  || '-';
            })
            .replace(/\s/g, '-');

        return str;
    };

    buildComponent = function (file) {
        // Put together most of the component now, and finish later when we
        // have all of them (partials).
        var contents, component, front, groupSplit, groupSlug;
        if (file.isNull()) {
            return;
        }
        if (file.isStream()) {
            return this.emit('error', new gutil.PluginError('components', 'Streaming not supported'));
        }
        contents = file.contents.toString('utf8');
        front = yamlFront.loadFront(contents);
        groupSplit = file.relative.split(path.sep).slice(0, -1);
        groupSlug = groupSplit.join('_');
        groups[groupSlug] = groups[groupSlug] || {
            slug: groupSlug,
            title: groupSlug
                .replace(/[-_]+/g, ' ')
                .replace(path.sep, ' ' + path.sep + ' '),
            components: []
        };

        component = {
            title: front.title ? front.title : null,
            details: front.details ? marked(front.details.trim()) : null,
            group: groupSplit.length > 0 ? groups[groupSlug] : null,
            template: front.__content,
            slug: slugify(file.relative),
            code: null,
            rendered: null
        };
        Handlebars.registerPartial(component.slug, component.template);

        components.push(component);
        groups[groupSlug].components.push(component);
    };

    buildLayout = function (file) {
        // Create templates from layouts and pipe them to the stream
        var contents, layout, template;
        if (file.substr(-5, 5) !== '.html') { return; }
        contents = fs.readFileSync(path.join(options.layoutsPath, file), 'utf8');
        template = Handlebars.compile(contents);
        layout = new gutil.File({
            cwd: __dirname,
            base: path.join(__dirname, options.layoutsPath),
            path: path.join(__dirname, options.layoutsPath, file),
            contents: new Buffer(template({
                components: components,
                groups: groups
            }), 'utf8')
        });

        this.emit('data', layout);
    };

    buildLayouts = function () {
        // Loop a second time to take advantage of partials
        components = components.map(function (component) {
            component.rendered = Handlebars.compile(component.template)();
            component.code = Handlebars.Utils.escapeExpression(component.rendered);
            return component;
        });

        fs.readdirSync(options.layoutsPath).forEach(buildLayout, this);

        this.emit('end');
    };

    return through(buildComponent, buildLayouts);
};
