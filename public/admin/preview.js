(function registerNotesPreview() {
  function valueToArray(value) {
    if (!value) return [];
    if (typeof value.toJS === 'function') return value.toJS();
    return Array.isArray(value) ? value : [value];
  }

  function formatLabel(value) {
    return String(value || '')
      .split('-')
      .map(function capitalize(part) {
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(' ');
  }

  function formatDate(value) {
    if (!value) return 'Publication date';
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('en', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  }

  function formatAuthorNames(names) {
    if (names.length < 2) return names[0] || 'Select an author';
    return names.slice(0, -1).join(', ') + ' & ' + names[names.length - 1];
  }

  function estimateReadingMinutes(body) {
    var words = String(body || '').trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 225));
  }

  function authorFallback(id) {
    return formatLabel(String(id || '').replaceAll('_', '-'));
  }

  var NotesPreview = createClass({
    getInitialState: function getInitialState() {
      return { authorNames: {} };
    },

    componentDidMount: function componentDidMount() {
      var component = this;
      if (typeof this.props.getCollection !== 'function') return;

      this.props.getCollection('authors').then(function mapAuthors(authors) {
        var names = {};
        authors.forEach(function mapAuthor(author) {
          var path = author.get('path') || '';
          var id = author.get('slug') || path.split('/').pop().replace(/\.json$/, '');
          var name = author.getIn(['data', 'name']);
          if (id && name) names[id] = name;
        });
        component.setState({ authorNames: names });
      }).catch(function ignoreCollectionError() {
        // Slug-based fallbacks keep the preview usable while a new author is unsaved.
      });
    },

    render: function render() {
      var entry = this.props.entry;
      var title = entry.getIn(['data', 'title']) || 'Untitled note';
      var description = entry.getIn(['data', 'description']) || 'Add a description.';
      var authorIds = valueToArray(entry.getIn(['data', 'authors']));
      var authors = authorIds.map(function authorName(id) {
        return this.state.authorNames[id] || authorFallback(id);
      }, this);
      var publishedAt = entry.getIn(['data', 'publishedAt']);
      var updatedAt = entry.getIn(['data', 'updatedAt']);
      var status = entry.getIn(['data', 'status']) || 'draft';
      var contentType = entry.getIn(['data', 'contentType']) || 'thought';
      var format = entry.getIn(['data', 'format']) || 'reflection';
      var topics = valueToArray(entry.getIn(['data', 'topics']));
      var body = entry.getIn(['data', 'body']) || '';
      var heroImage = entry.getIn(['data', 'heroImage']);
      var heroAlt = entry.getIn(['data', 'heroAlt']) || '';
      var source = entry.getIn(['data', 'source']);
      var heroAsset = heroImage ? this.props.getAsset(heroImage) : null;
      var metadata = [
        h('span', { key: 'authors' }, 'By ' + formatAuthorNames(authors)),
        h('time', { key: 'published', dateTime: String(publishedAt || '') }, formatDate(publishedAt)),
      ];

      if (updatedAt) metadata.push(h('span', { key: 'updated' }, 'Updated ' + formatDate(updatedAt)));
      metadata.push(h('span', { key: 'reading' }, estimateReadingMinutes(body) + ' min read'));

      return h('article', { className: 'article preview-article' },
        status === 'archived'
          ? h('aside', { className: 'archive-banner' },
              h('strong', {}, 'Archived'),
              h('p', {}, 'This note remains available at its stable URL but is no longer part of the active publication index.'),
            )
          : null,
        h('header', { className: 'article-header' },
          h('p', { className: 'eyebrow' }, formatLabel(contentType) + ' · ' + formatLabel(format)),
          h('h1', {}, title),
          h('p', { className: 'article-dek' }, description),
          h('div', { className: 'article-meta' }, metadata),
          h('div', { className: 'topic-list', 'aria-label': 'Topics' },
            topics.map(function renderTopic(topic) {
              return h('span', { className: 'topic-link', key: topic }, topic);
            }),
          ),
        ),
        heroAsset
          ? h('figure', { className: 'article-hero' },
              h('img', { src: heroAsset.toString(), alt: heroAlt }),
            )
          : null,
        h('div', { className: 'reading-width article-body' },
          this.props.widgetFor('body'),
          source
            ? h('aside', { className: 'source-card' },
                h('p', { className: 'eyebrow' }, formatLabel(source.get('type') || 'source')),
                h('h2', {}, source.get('title') || 'Source'),
                source.get('creator') ? h('p', {}, source.get('creator')) : null,
              )
            : null,
        ),
      );
    },
  });

  CMS.registerPreviewTemplate('notes', NotesPreview);
})();
