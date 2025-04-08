<template>
  <div class="min-h-screen bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex flex-col">

    <header
      class="backdrop-blur bg-white/30 shadow-sm px-6 py-4 flex justify-between items-center"
    >
      <h1 class="text-2xl font-bold text-white drop-shadow">Rental Dashboard</h1>
    </header>

    <main class="flex-grow px-4 py-6 sm:px-8 sm:py-10">
      <div class="bg-white/80 rounded-xl shadow-lg backdrop-blur p-3 max-w-7xl mx-auto">
        <router-view />
      </div>
    </main>

    <footer class="bg-white/20 backdrop-blur py-4 text-center text-white mt-auto">
      <p class="text-sm font-light">
        &copy; 2025 Rental Dashboard. All rights reserved.
      </p>
    </footer>
  </div>
</template>
