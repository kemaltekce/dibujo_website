Vue.component('bullet', {
  props: ['bullet', 'styles'],
  template: `
    <div class="bullet" :id="bullet.style">
      <div class="bullet-style" v-if="bullet.style" @click="iterateStyle">
        <span v-html="styles[bullet.style].content" :class="styles[bullet.style].style"></span>
      </div>
      <div
        class="bullet-text"
        contenteditable="true"
        v-text="bullet.text"
        @focus="activateEditMode"
        @blur="edit"
        @keydown.up="moveUp"
        @keydown.down="moveDown"
        @keydown.enter.prevent.stop="endEdit"
        @keydown.delete="removeBullet"
        @keyup.229="executeShortCmd"
        @keyup.32="executeShortCmd"
        @keydown.tab.prevent="executeShortCmd"
        @keydown.alt.188.capture.prevent.stop="iteratePage"
        @keyup.shift.55="activateCmdMode"
        @keyup.esc="deactivateCmdMode"
        v-on="this.cmdMode ? { keyup: trackCmd } : null">
      </div>
      <cmdbar
        v-if="cmdMode" :text="currentCmd"
        v-on:run-cmd="runCmdButton"
      ></cmdbar>
      <cmdbar-mobile
        v-if="this.$root.mobileVersion && editMode && !cmdMode"
        v-on:run-cmd-mobile="runCmdButtonMobile"
      ></cmdbar-mobile>
    </div>
  `,
  data: function() {
    return {
      editMode: false,
      cmdMode: false,
      cmdSlashPosition: null,
      currentCmd: '',
    }
  },
  methods: {
    activateEditMode() {
      setTimeout(() => {
        this.editMode = true
      }, 301)
    },
    iteratePage() {this.$emit('iterate-page')},
    activateCmdMode() {
      this.cmdMode = true
      this.cmdSlashPosition = window.getSelection()['anchorOffset']
    },
    deactivateCmdMode() {
      this.cmdMode = false
      this.cmdSlashPosition = null
      this.currentCmd = ''
    },
    trackCmd(event) {
      if (this.cmdMode) {
        var currentAnchorPosition = window.getSelection()['anchorOffset']
        var currentText = event.target.innerText
        if (currentAnchorPosition < this.cmdSlashPosition) {
          this.deactivateCmdMode()
        } else {
          this.currentCmd = currentText.slice(this.cmdSlashPosition, currentAnchorPosition)
        }
      }
    },
    runCmd(cmdText) {
      bulletCmds = ['h1', 'h2', 'todo', 'done', 'note', 'migrate', 'future',
        'tab', 'empty']
      if (bulletCmds.indexOf(cmdText) !== -1) {
        if (cmdText === 'empty') {
          this.$emit('change-bullet-style', {id: this.bullet.id, newStyle: undefined})
        } else {
          this.$emit('change-bullet-style', {id: this.bullet.id, newStyle: cmdText})
        }
      } else if (cmdText === 'newcollup') {
        this.$emit('add-collection', {currentBullet: this.bullet, place: 0})
      } else if (cmdText === 'newcolldown') {
        this.$emit('add-collection', {currentBullet: this.bullet, place: 1})
      } else if (cmdText === 'nav') {
        this.$emit('change-pagenav-visibility')
      } else if (cmdText === 'sidebar') {
        this.$emit('change-sidepage-visibility')
      }
    },
    runCmdButton({cmdText}) {
      // adjust text
      console.log(this.currentCmd)
      var currentAnchorPosition = this.cmdSlashPosition + this.currentCmd.length
      var currentBulletText = this.bullet.text
      var newText = currentBulletText.slice(0, this.cmdSlashPosition - 1) + currentBulletText.slice(currentAnchorPosition)
      this.$emit('edit-bullet-text', {id: this.bullet.id, newText: newText})
      this.$root.setEndOfContenteditable(this.$el.querySelector('.bullet-text'), this.cmdSlashPosition - 1)
      // run cmd
      this.runCmd(cmdText)
    },
    runCmdButtonMobile({cmdText}) {
      // can't propperly set it back to actual position so set it to end
      this.$root.setEndOfContenteditable(this.$el.querySelector('.bullet-text'), this.bullet.text.length)
      this.runCmd(cmdText)
    },
    edit(event) {
      // edit text after next tick, because if sidepage is closed with the cmd
      // /sidepage the bullet will not exist anymore to focus on. With the next
      // tick the emit will stop propagating to the collection because it doesn't
      // exist anymore.
      this.$nextTick(() => {
        var newText = event.target.innerText
        this.$emit('edit-bullet-text', {id: this.bullet.id, newText: newText})
        setTimeout(() => {
          this.deactivateCmdMode()
          this.editMode = false
        }, 300)
      })
    },
    keepTextWithoutCmd(event, bullet, text, cmd) {
      // real commands start with a '/' and need to be removed from the text
      if (/\//.test(cmd)) {
        var adjusted_text = text.replace(cmd, '')
      // the rest are short cmd which are only allowed at the beginning
      // and are two elements long
      } else {
        var adjusted_text = text.splice(2)
      }
      this.$emit('edit-bullet-text', {id: bullet.id, newText: adjusted_text})
      var offset
      if (cmd === '/tab') {
        // tab is not an actual text we removed
        offset = window.getSelection()['anchorOffset']
      } else if (cmd instanceof RegExp) {
        // regex is used for short cmd.
        var matches = text.match(cmd)
        offset = window.getSelection()['anchorOffset'] - matches[0].length
      } else {
        // adjust offset to match offset without cmd
        offset = window.getSelection()['anchorOffset'] - cmd.length
      }
      event.target.innerText = adjusted_text
      this.$root.setEndOfContenteditable(this.$el.querySelector('.bullet-text'), offset)
    },
    changeStyle(event, bullet, text, style) {
      this.keepTextWithoutCmd(event, bullet, text, "/" + style)
      if (style === 'empty') {
        this.$emit('change-bullet-style', {id: bullet.id, newStyle: undefined})
      } else {
        this.$emit('change-bullet-style', {id: bullet.id, newStyle: style})
      }
    },
    iterateStyle(event) {
      const iterateableStyles = ['todo', 'done', 'migrate', 'future', 'note'];
      var isStyle = (element) => element === this.bullet.style
      var currentStyleIndex = iterateableStyles.findIndex(isStyle)
      if (currentStyleIndex === iterateableStyles.length - 1) {
        currentStyleIndex = -1
      }
      this.$emit('change-bullet-style', {id: this.bullet.id, newStyle: iterateableStyles[currentStyleIndex + 1]})
    },
    addCollection(event, bullet, text, cmd, place) {
      this.keepTextWithoutCmd(event, bullet, text, cmd)
      this.$emit('add-collection', {currentBullet: bullet, place: place})
    },
    moveUp(event) {this.$emit('move-up', {currentBullet: this.bullet, event: event})},
    moveDown(event) {this.$emit('move-down', {currentBullet: this.bullet, event: event})},
    endEdit(event) {
      var currentText = event.target.innerText
      if (currentText.includes("/done")) {
        this.changeStyle(event, this.bullet, currentText, "done")
      } else if (currentText.includes("/todo")) {
        this.changeStyle(event, this.bullet, currentText, "todo")
      } else if (currentText.includes("/empty")) {
        this.changeStyle(event, this.bullet, currentText, "empty")
      } else if (currentText.includes("/tab")) {
        this.changeStyle(event, this.bullet, currentText, "tab")
      } else if (currentText.includes("/note")) {
        this.changeStyle(event, this.bullet, currentText, "note")
      } else if (currentText.includes("/migrate")) {
        this.changeStyle(event, this.bullet, currentText, "migrate")
      } else if (currentText.includes("/future")) {
        this.changeStyle(event, this.bullet, currentText, "future")
      } else if (currentText.includes("/h1")) {
        this.changeStyle(event, this.bullet, currentText, "h1")
      } else if (currentText.includes("/h2")) {
        this.changeStyle(event, this.bullet, currentText, "h2")
      } else if (currentText.includes("/newcollup")) {
        this.addCollection(event, this.bullet, currentText, "/newcollup", 0)
      } else if (currentText.includes("/newcolldown")) {
        this.addCollection(event, this.bullet, currentText, "/newcolldown", 1)
      } else if (currentText.includes("/nav")) {
        this.keepTextWithoutCmd(event, this.bullet, currentText, "/nav")
        this.$emit('change-pagenav-visibility')
      } else if (currentText.includes("/sidebar")) {
        this.keepTextWithoutCmd(event, this.bullet, currentText, "/sidebar")
        this.$emit('change-sidepage-visibility')
      } else {
        this.$emit('add-bullet', {currentBullet: this.bullet, currentText: currentText})
      }
    },
    removeBullet(event) {
      // delete bullet
      if (event.target.innerText.length === 0 && this.bullet.style === undefined) {
        this.$emit('remove-bullet', this.bullet)
        // prevent deleting character in next bullet
        this.$nextTick(() => {
            event.preventDefault()
        })
      // delete style
      } else if (window.getSelection()['anchorOffset'] === 0 && this.bullet.style) {
        this.$emit('remove-bullet-style', this.bullet.id)
      }
    },
    executeShortCmd(event) {
      var currentText = event.target.innerText
      var shortCmd = currentText.slice(0, 2)
      var spaceEvent = event.code === 'Space' || event.which === 229 || event.which === 32
      // event.which === 229 added because space is not recognized on android phone
      // event.which === 32 for firefox on mobile
      // short comments with one element. two if you include the space
      if (spaceEvent && window.getSelection()['anchorOffset'] === 2) {
        if (/\s{2}/.test(shortCmd)) {
          this.keepTextWithoutCmd(event, this.bullet, currentText, /\s{2}/)
          this.$emit('change-bullet-style', {id: this.bullet.id, newStyle: 'tab'})
        } else if (/\.\s{1}/.test(shortCmd)) {
          this.keepTextWithoutCmd(event, this.bullet, currentText, /\.\s{1}/)
          this.$emit('change-bullet-style', {id: this.bullet.id, newStyle: 'todo'})
        } else if (/x\s{1}/.test(shortCmd)) {
          this.keepTextWithoutCmd(event, this.bullet, currentText, /x\s{1}/)
          this.$emit('change-bullet-style', {id: this.bullet.id, newStyle: 'done'})
        } else if (/<\s{1}/.test(shortCmd)) {
          this.keepTextWithoutCmd(event, this.bullet, currentText, /<\s{1}/)
          this.$emit('change-bullet-style', {id: this.bullet.id, newStyle: 'future'})
        } else if (/>\s{1}/.test(shortCmd)) {
          this.keepTextWithoutCmd(event, this.bullet, currentText, />\s{1}/)
          this.$emit('change-bullet-style', {id: this.bullet.id, newStyle: 'migrate'})
        } else if (/-\s{1}/.test(shortCmd)) {
          this.keepTextWithoutCmd(event, this.bullet, currentText, /-\s{1}/)
          this.$emit('change-bullet-style', {id: this.bullet.id, newStyle: 'note'})
        } else if (/#\s{1}/.test(shortCmd)) {
          this.keepTextWithoutCmd(event, this.bullet, currentText, /#\s{1}/)
          this.$emit('change-bullet-style', {id: this.bullet.id, newStyle: 'h1'})
        }
      // short comments with two element. three if you include the space
      } else if (spaceEvent && window.getSelection()['anchorOffset'] === 3) {
        shortCmd = currentText.slice(0, 3)
        if (/##\s{1}/.test(shortCmd)) {
          this.keepTextWithoutCmd(event, this.bullet, currentText, /##\s{1}/)
          this.$emit('change-bullet-style', {id: this.bullet.id, newStyle: 'h2'})
        }
      }
      if (this.bullet.style === undefined && event.code === 'Tab') {
        this.changeStyle(event, this.bullet, currentText, "tab")
      }
    },
  }
})
