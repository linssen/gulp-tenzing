'use strict';

var _, Buffer, File, fs, gutil, Handlebars, marked, path, through, yamlFront;

Buffer = require('buffer').Buffer;
fs = require('fs');
gutil = require('gulp-util');
Handlebars = require('Handlebars');
marked = require('marked');
path = require('path');
through = require('through');
yamlFront = require('yaml-front-matter');

module.exports = function (options) {
    var buildComponents, buildComponent, buildTemplates, data, slugify;

    options = options || {src: './components/templates'};
    data = [];

    slugify = function (file) {
        return file.replace(/\.html$/, '');
    };

    buildComponents = function () {
        var components;

        components = [];

        fs.readdirSync(options.src).forEach(function (f) {
            var component;
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
        var contents, front;

        contents = fs.readFileSync(path.join(options.src, file), 'utf8');
        front = yamlFront.loadFront(contents);

        return {
            title: front.title ? front.title : null,
            details: front.details ? marked(front.details.trim()) : null,
            template: front.__content,
            slug: slugify(file),
            code: null,
            rendered: null
        };
    };

    buildTemplates = function (file) {
        var contents, template;

        if (file.isNull()) {
            return;
        }
        if (file.isStream()) {
            return this.emit('error', new gutil.PluginError('templates', 'Streaming not supported'));
        }

        contents = file.contents.toString('utf8');
        template = Handlebars.compile(contents);
        file.contents = new Buffer(template({components: data}), 'utf8');

        return this.push(file);
    };

    data = buildComponents.call(this);

    return through(buildTemplates);
};
