import { d as defineComponent, s as script$1, c as createBlock, w as withCtx, r as resolveComponent, o as openBlock, a as createElementBlock, F as Fragment, b as renderList, e as createBaseVNode, t as toDisplayString, f as createCommentVNode, g as createApp } from './Layout-58b40d5f.js';

var script = defineComponent({
  components: {
    Layout: script$1
  },

  props: ['allMetadata'],

  setup(props) {
    return props;
  }
});

const _hoisted_1 = /*#__PURE__*/createBaseVNode("h1", { class: "display-4" }, "List of Stanzas", -1 /* HOISTED */);
const _hoisted_2 = {
  key: 0,
  class: "list-group mt-3"
};
const _hoisted_3 = ["href"];
const _hoisted_4 = {
  key: 0,
  class: "small text-muted text-truncate mt-1 mb-0"
};
const _hoisted_5 = { key: 1 };

function render(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_Layout = resolveComponent("Layout");

  return (openBlock(), createBlock(_component_Layout, null, {
    default: withCtx(() => [
      _hoisted_1,
      (_ctx.allMetadata.length > 0)
        ? (openBlock(), createElementBlock("div", _hoisted_2, [
            (openBlock(true), createElementBlock(Fragment, null, renderList(_ctx.allMetadata, (metadata) => {
              return (openBlock(), createElementBlock("a", {
                key: metadata['@id'],
                href: `./${metadata['@id']}.html`,
                class: "list-group-item list-group-item-action py-3"
              }, [
                createBaseVNode("div", null, toDisplayString(metadata['stanza:label']), 1 /* TEXT */),
                (metadata['stanza:definition'])
                  ? (openBlock(), createElementBlock("p", _hoisted_4, toDisplayString(metadata['stanza:definition']), 1 /* TEXT */))
                  : createCommentVNode("v-if", true)
              ], 8 /* PROPS */, _hoisted_3))
            }), 128 /* KEYED_FRAGMENT */))
          ]))
        : (openBlock(), createElementBlock("p", _hoisted_5, "No stanzas defined."))
    ]),
    _: 1 /* STABLE */
  }))
}

script.render = render;
script.__file = "node_modules/togostanza/src/components/Index.vue";

var allMetadata = [{"@context":{"stanza":"http://togostanza.org/resource/stanza#"},"@id":"gfa","stanza:label":"GFA","stanza:definition":"gfa","stanza:license":"MIT","stanza:author":"DBCLS","stanza:contributor":[],"stanza:created":"2024-03-29","stanza:updated":"2024-03-29","stanza:parameter":[{"stanza:key":"say-to","stanza:type":"string","stanza:example":"world","stanza:description":"who to say hello to","stanza:required":false}],"stanza:menu-placement":"bottom-right","stanza:style":[{"stanza:key":"--greeting-color","stanza:type":"color","stanza:default":"#eb7900","stanza:description":"text color of greeting"},{"stanza:key":"--greeting-align","stanza:type":"single-choice","stanza:choice":["left","center","right"],"stanza:default":"center","stanza:description":"text align of greeting"}],"stanza:incomingEvent":[],"stanza:outgoingEvent":[]},{"@context":{"stanza":"http://togostanza.org/resource/stanza#"},"@id":"relate","stanza:label":"Relate","stanza:definition":"Relate stanza","stanza:type":"Stanza","stanza:display":"Chart","stanza:provider":"TogoStanza","stanza:license":"MIT","stanza:author":"DBCLS","stanza:address":"https://github.com/togostanza/metastanza","stanza:contributor":["PENQE"],"stanza:created":"2024-3-29","stanza:updated":"2024-3-29","stanza:parameter":[{"stanza:key":"say-to","stanza:type":"string","stanza:example":"world","stanza:description":"who to say hello to","stanza:required":false}],"stanza:menu-placement":"bottom-right","stanza:style":[{"stanza:key":"--greeting-color","stanza:type":"color","stanza:default":"#eb7900","stanza:description":"text color of greeting"},{"stanza:key":"--greeting-align","stanza:type":"single-choice","stanza:choice":["left","center","right"],"stanza:default":"center","stanza:description":"text align of greeting"}]}];

createApp(script, {allMetadata}).mount('body');
//# sourceMappingURL=index-app.js.map
