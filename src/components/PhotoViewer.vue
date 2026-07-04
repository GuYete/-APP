<template>
  <div v-if="visible" class="photo-viewer-overlay" @click.self="$emit('close')">
    <div class="photo-viewer">
      <img :src="src" alt="票据" />
      <button class="photo-close" @click="$emit('close')">✕</button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ visible: boolean; src: string }>()
defineEmits<{ close: [] }>()
</script>

<style scoped>
.photo-viewer-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.85); display: flex; align-items: center;
  justify-content: center; z-index: 2000;
}
.photo-viewer {
  position: relative; max-width: 90vw; max-height: 90vh;
}
.photo-viewer img {
  max-width: 90vw; max-height: 85vh; border-radius: 8px; object-fit: contain;
}
.photo-close {
  position: absolute; top: -36px; right: 0;
  width: 32px; height: 32px; border: none; border-radius: 50%;
  background: rgba(255,255,255,0.2); color: #fff; font-size: 16px; cursor: pointer;
}
</style>
