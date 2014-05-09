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
    var buildComponent, buildLayouts, buildLayout, components,
        handleBarsHelpers, groups, slugify;

    options = options || {layoutsPath: './layouts/templates'};
    components = [];
    groups = {};

    handleBarsHelpers = function () {
        Handlebars.registerHelper('filter', function (context, options) {
            var filtered, filters;
            filtered = [];
            filters = {with: [], without: []};
            // Add comma separated filter groups to the relavent keys
            for (var key in filters) {
                if (options.hash[key] === undefined) { continue; }
                filters[key] = options.hash[key].split(',').map(function (v) {
                    return v.trim();
                });
            }
            // If there are no filters, then return nuthin
            if (filters.without.length + filters.with.length === 0) {
                return filtered.join('');
            }
            // Compare the slugs in the loop against those in the filters
            // it is in this way possible to have with AND without should you
            // want to.
            for (var slug in context) {
                // Only add the group once
                if (filtered.indexOf(context[slug].slug) !== -1) { continue; }
                // With
                if (filters.with.length > 0 && filters.with.indexOf(context[slug].slug) !== -1) {
                    filtered.push(options.fn(context[slug]));
                }
                // Without
                if (filters.without.length > 0 && filters.without.indexOf(context[slug].slug) === -1) {
                    filtered.push(options.fn(context[slug]));
                }
            }
            return filtered.join('');
        });
    };

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
        var contents, component, front, group;
        if (file.isNull()) {
            return;
        }
        if (file.isStream()) {
            return this.emit('error', new gutil.PluginError('components', 'Streaming not supported'));
        }
        contents = file.contents.toString('utf8');
        front = yamlFront.loadFront(contents);
        group = {};
        group.title = file.relative.split(path.sep).slice(0, -1)[0] || 'Ungrouped';
        group.title = group.title.replace(/[-_]/g, ' ');
        group.slug = slugify(group.title);
        group.components = [];
        groups[group.slug] = groups[group.slug] || group;
        component = {
            title: front.title ? front.title : null,
            details: front.details ? marked(front.details.trim()) : null,
            group: groups[group.slug],
            template: front.__content,
            slug: slugify(file.relative),
            code: null,
            rendered: null
        };
        Handlebars.registerPartial(component.slug, component.template);

        components.push(component);
        groups[group.slug].components.push(component);
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

            if (component.group) {
                groups[component.group.slug] = groups[component.group.slug] || component.group;
                groups[component.group.slug].components.push(component);
            }

            return component;
        });

        fs.readdirSync(options.layoutsPath).forEach(buildLayout, this);

        this.emit('end');
    };

    handleBarsHelpers();

    return through(buildComponent, buildLayouts);
};
