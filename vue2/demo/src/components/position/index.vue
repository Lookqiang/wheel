<template>
  <div>
    <div class="mian-warp" style="margin-bottom: 20px; z-index: 888888; position: relative" id="position"></div>
  </div>
</template>

<script>
  import Position from "common";
  export default {
    components: {},
    data() {
      return {
        position: {},
      };
    },
    mounted() {
      let self = this;
      new Position({
        el: "position",
        src: "http://localhost:3000/test.png",
        getData: function () {
          console.log(this);
          self.$set(self, "position", this.relationData);
        },
      });
    },
  };
</script>

<style scoped>
  .mian-warp {
    width: 800px;
    height: 600px;
    border: 1px solid #000;
  }
</style>
