import './app.css'

export async function mount(root: HTMLElement): Promise<void> {
  root.innerHTML = '<p class="app-loading">markdown.style editor</p>'
}

const appRoot = document.getElementById('app')
if (appRoot) void mount(appRoot)
