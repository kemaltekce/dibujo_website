Vue.component('cmdbar', {
  props: ['text'],
  template: `
    <div class="cmdbar">
      <div
        v-for="cmd in cmds.filter( x => x.indexOf(text) !== -1)" :key="cmd"
        class="cmd"
        @click="runCmd"
        >{{ cmd }}
      </div>
    </div>
  `,
  data: function() {
    return {
      cmds: [
        'h1', 'h2', 'todo', 'done', 'note', 'migrate', 'future', 'tab',
        'empty', 'newcollup', 'newcolldown', 'nav', 'sidebar'],
    }
  },
  methods: {
    runCmd(event) {
      var cmdText = event.target.innerText;
      this.$emit('run-cmd', {cmdText: cmdText});
    },
  },
})

Vue.component('cmdbar-mobile', {
  template: `
    <div class="cmdbar">
      <div
        v-for="cmd in cmds" :key="cmd"
        class="cmd"
        @click="runCmd"
        >{{ cmd }}
      </div>
    </div>
  `,
  data: function() {
    return {
      cmds: [
        'h1', 'h2', 'todo', 'done', 'note', 'migrate', 'future', 'tab',
        'empty', 'newcollup', 'newcolldown', 'nav', 'sidebar'],
    }
  },
  methods: {
    runCmd(event) {
      var cmdText = event.target.innerText;
      this.$emit('run-cmd-mobile', {cmdText: cmdText, position: window.getSelection()['anchorOffset']});
    },
  },
})