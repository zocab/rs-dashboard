<template>
  <div
    class="min-h-screen bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex flex-col bg-cover bg-center"
    style="background-image: url('/rs-dashboard/bg.jpg')"
  >
    <header class="backdrop-blur bg-white/30 shadow-sm px-6 py-4 flex justify-between items-center">
      <h1>
        <router-link to="/" class="text-2xl font-bold text-green-600 hover:opacity-75 transition-all">
          Rental Dashboard
        </router-link>
      </h1>
    </header>

    <main class="flex-grow px-4 py-6 sm:px-8 sm:py-10 my-6 bg-white/50 rounded-xl shadow-lg backdrop-blur p-3 w-full xl:w-7xl mx-auto h-full">
      <router-view />
    </main>

    <footer class="bg-white/20 backdrop-blur py-4 text-center text-black mt-auto">
      <p class="text-sm font-light">&copy; 2025 Rental Dashboard. All rights reserved.</p>
    </footer>
  </div>
</template>
