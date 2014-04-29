'use strict';

var Buffer, File, fs, gutil, Handlebars, marked, path, through, yamlFront;

Buffer = require('buffer').Buffer;
fs = require('fs');
gutil = require('gulp-util');
Handlebars = require('handlebars');
marked = require('marked');
path = require('path');
through = require('through');
yamlFront = require('yaml-front-matter');

module.exports = function (options) {
    var buildComponents, buildComponent, buildTemplates, data, slugify;

    options = options || {src: './components/templates'};
    data = [];

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
            });

        return str;
    };

    buildComponents = function () {
        var components;

        components = [];

        fs.readdirSync(options.src).forEach(function (f) {
            var component;
            if (f.substr(-5, 5) !== '.html') return;
            component = buildComponent(f);
            Handlebars.registerPartial(component.slug, component.template);
            components.push(component);
        });

        // Loop a second time to take advantage of partials
        components.map(function (component) {
            component.rendered = Handlebars.compile(component.template)();
            component.code = Handlebars.Utils.escapeExpression(component.rendered);
        });

        return components;
    };

    buildComponent = function (file) {
        var contents, front, group;

        contents = fs.readFileSync(path.join(options.src, file), 'utf8');
        front = yamlFront.loadFront(contents);

        return {
            title: front.title ? front.title : null,
            details: front.details ? marked(front.details.trim()) : null,
            group: front.group ? slugify(front.group) : null,
            template: front.__content,
            slug: slugify(file),
            code: null,
            rendered: null
        };
    };

    buildTemplates = function (file) {
        var contents, groups, template;

        groups = {};

        if (file.isNull()) {
            return;
        }
        if (file.isStream()) {
            return this.emit('error', new gutil.PluginError('templates', 'Streaming not supported'));
        }

        data.forEach(function (d) {
            if (!d.group) { return; }
            groups[d.group] = groups[d.group] || {
                title: d.group,
                slug: d.group,
                components: []
            };
            groups[d.group].components.push(d);
            // Overwrite the group slug string with this full object
            d.group = groups[d.group];
        });

        contents = file.contents.toString('utf8');
        template = Handlebars.compile(contents);
        file.contents = new Buffer(template({
            components: data,
            groups: groups
        }), 'utf8');

        return this.push(file);
    };

    data = buildComponents.call(this);

    return through(buildTemplates);
};
