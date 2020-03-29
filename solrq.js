class SolrQObj {

  constructor(properties) {
    this.properties = properties;
  }

  endpoint(category, keywords) {

    const urlAPI = 'https://www.vam.ac.uk/api/json/museumobject/';
    const limit = 45;
    const offset = 0;
    if (keywords) {
      keywords = this.properties.makeSafe(keywords);
    }
    if (category) {
      category = `&category=${this.properties.makeSafe(category)}`;
    }
    let endpoint = `${urlAPI}search?images=1&limit=${limit}&offset=${offset}&q=${keywords}${category}`;
    console.log(endpoint);
    return endpoint;
  }

  options() {
    return {
      headers: {
      },
    };
  }

  total(parsed) {
    return parsed.meta.result_count;
  }

  docs(parsed) {
    return parsed.records
  }
}

class SolrqUI {

  constructor(properties) {
    this.properties = properties;

    this.results = document.querySelector(`#results`);
    this.category = document.querySelector(`#category`);
    this.keywords = document.querySelector(`#keywords`);

    this.reset = document.querySelector(`#reset`);
    this._onReset = this._onReset.bind(this);
    this.reset.addEventListener(`click`, this._onReset);

    this.search = document.querySelector(`#search`);
    this._onSearch = this._onSearch.bind(this);
    this.search.addEventListener(`click`, this._onSearch);
  }

  _onSearch(e) {
    e.preventDefault();
    this.results.innerHTML = ``;
    this.properties.doSearch(this.category.value, this.keywords.value);
  }

  _onReset(e) {
    e.preventDefault();
    this.resetInputs();
    const href = `${window.location.protocol}//${window.location.hostname}${window.location.pathname}`;
    window.location.replace(href);
  }

  resetInputs() {
    this.results.innerHTML = ``;
    this.keywords.value = ``;
    this.category.value = ``;
  }

  error(message) {
    this.results.innerHTML = message;
  }

  showResults(docs) {
    for (const i in docs) {
      let doc = docs[i];
      if (doc.hasOwnProperty(`fields`)) {
        let id = doc.fields.object_number + '_' + doc.fields.slug;
        let url = `https://collections.vam.ac.uk/item/${id.replace(/_/g, '/')}`;
        let suffix = `_jpg_${(window.innerWidth < 600 ? 's' : (window.innerWidth > 900 ? 'ws' : 'o'))}.jpg`;
        let image = `https://media.vam.ac.uk/media/thira/collection_images/${doc.fields.primary_image_id.substr(0, 6)}/${doc.fields.primary_image_id}${suffix}`;
        let caption = `${doc.fields.object} ${doc.fields.title}`;

        let parent = document.createElement(`li`);
        parent.className = `result`;

        let link = document.createElement(`a`);
        link.className = `subject`;
        link.innerHTML = `<img src="${image}">`;
        link.href = `${url}`;
        link.dataset.target = `body-${id}`;

        parent.appendChild(link);
        this.results.appendChild(parent);
      }
    }
  }
}

class SolrQ {

  constructor() {
    this.state = {loading: false};
    this.ui = new SolrqUI({
      makeSafe: this.makeSafe.bind(this),
      doSearch: this.doSearch.bind(this),
    });
  }

  loadSource() {
    this.source = new SolrQObj({
      makeSafe: this.makeSafe.bind(this),
    });
  }

  async doSearch(category, keywords) {
    if (this.state.loading)
      return;

    this.state.loading = true;
    this.loadSource();
    try {
      const endpoint = this.source.endpoint(category, keywords);
      const options = this.source.options();
      const res = await fetch(endpoint, options);
      if (!res.ok) {
        throw new Error(res.statusText);
      }
      const parsed = await res.json();
      if (parsed) {
        let total = this.source.total(parsed);
        if (total > 0) {
          const docs = this.source.docs(parsed);
          this.ui.showResults(docs);
        } else {
          this.ui.error(`No results`);
        }
      }
    } catch (err) {
      console.log(`SolrQ.doSearch`, err);
    } finally {
      this.state.loading = false;
    }
  }

  makeSafe(value) {
    return value ? encodeURIComponent(value.trim()) : ``;
  }
}