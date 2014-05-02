var Buffer, files, File, fs, should, tenzing;

Buffer = require('buffer').Buffer;
File = require('gulp-util').File;
fs = require('fs');
tenzing = require('../');
should = require('should');

require('mocha');

files = {
    components: {
        button: '---\ntitle: Button\ngroup: Forms\ndetails: |\n    Some _markdown_.\n---\n<button>I am a button</button>',
        form: '<form><label>Label</label>{{> button}}</form>'
    },
    layout: {
        src:
            '<h1>Layout</h1>' +
            '{{#each components}}' +
                '{{#if title}}<div class="title>{{title}}</div>{{/if}}' +
                '{{#if details}}<div class="details>{{{details}}}</div>{{/if}}' +
                '<div class="code">{{{code}}}</div>' +
                '<div class="rendered">{{{rendered}}}</div>' +
            '{{/each}}' +
            '<div class="groups">' +
                '{{#each groups}}' +
                    '<a href="#group-{{slug}}">{{title}}</a><br>' +
                '{{/each}}' +
            '</div>',
        dest:
            '<h1>Layout</h1>' +
            '<div class="title>Button</div>' +
            '<div class="details><p>Some <em>markdown</em>.</p>\n</div>' +
            '<div class="code">\n&lt;button&gt;I am a button&lt;/button&gt;</div>' +
            '<div class="rendered">\n<button>I am a button</button></div>' +
            '<div class="code">&lt;form&gt;&lt;label&gt;Label&lt;/label&gt;\n&lt;button&gt;I am a button&lt;/button&gt;&lt;/form&gt;</div>' +
            '<div class="rendered"><form><label>Label</label>\n<button>I am a button</button></form></div>' +
            '<div class="groups"><a href="#group-forms">Forms</a></div>'
    }
};

describe('Stylguide', function () {
    var stream, writeLayout;

    writeLayout = function (stream) {
        stream.write(new File({
            cwd: '.',
            base: '.',
            path: 'test/layouts/form.html',
            contents: new Buffer(files.layout.src)
        }));
    };

    before(function () {
        fs.writeFileSync('test/fixtures/components/button.html', files.components.button);
        fs.writeFileSync('test/fixtures/components/form.html', files.components.form);
    });

    after(function () {
        fs.unlinkSync('test/fixtures/components/button.html');
        fs.unlinkSync('test/fixtures/components/form.html');
    });

    beforeEach(function () {
        stream = tenzing({src: 'test/fixtures/components'});
    });

    it('should find our components and render them correctly', function () {
        stream.on('data', function (layout) {
            (layout).should.be.ok;
            (layout.path).should.be.ok;
            (layout.contents).should.be.ok;
            (layout.contents.toString()).should.equal(files.layout.dest);
        });
        writeLayout(stream);
    });

    // These pendings are all covered by the above, but what's the point
    // in unit testing if you aren't going to test units?!
    it('should register each component as a partial with Handlebars');
    it('should convert the front matter YAML appropriately');
    it('should escape the code correctly');
    it('should have correctly assigned groups');
});
