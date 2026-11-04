import { iconSvg } from './icons.js'

/**
 * TouchFish 支持列表
 * 
 * Migrated to Soberjs (since MIUI is so F**king hard use and ugly)
 * Sober 组件通过 `document.createElement` 动态创建原因见 index.html 中注释（构造期写入标记属性，会与自定义元素的升级流程冲突）。
 */

const THEME_KEY = 'touchfish-supported:theme'
const DEFAULT_TITLE = 'TouchFish 支持列表'
const LINK_VARIANTS = ['filled', 'elevated', 'tonal', 'outlined', 'text']
const BADGE_TONES = {
  default: 'chip-muted',
  muted: 'chip-muted',
  info: 'chip-info',
  accent: 'chip-accent',
  success: 'chip-success',
  warning: 'chip-warning',
  error: 'chip-error'
}

let config = null
let dom = null


// basic

/**
 * 创建元素。
 * @param {string} tag
 * @param {Record<string, any>} [props] class / text / slot / on* / 其他
 * @param {...any} children
 */
function h(tag, props = {}, ...children) {
  const el = document.createElement(tag)

  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false || value === '') continue
    if (key === 'class') el.className = value
    else if (key === 'text') el.textContent = value
    else if (key === 'slot') el.slot = value
    else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value)
    } else {
      el.setAttribute(key, value === true ? '' : String(value))
    }
  }

  for (const child of children.flat()) {
    if (child === undefined || child === null || child === false) continue
    el.append(typeof child === 'string' ? document.createTextNode(child) : child)
  }

  return el
}

/** 创建 <s-icon> */
function sIcon(name, props = {}) {
  const icon = h('s-icon', props)
  icon.innerHTML = iconSvg(name)
  return icon
}

/** 转为去空白 */
function str(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function strArray(value) {
  if (!Array.isArray(value)) return []
  return value.map((item) => str(item)).filter(Boolean)
}

function warn(message, detail) {
  console.warn(`[TouchFish Supported] ${message}`, detail ?? '')
}


function normalizeIcon(input) {
  if (typeof input === 'string') return { type: 'material', value: input.trim() }
  if (!input || typeof input !== 'object') return { type: 'material', value: 'apps' }

  const type = str(input.type) || 'material'
  const value = str(input.value)
  if (!value) return { type: 'material', value: 'apps' }
  if (type === 'url' || type === 'image' || type === 'emoji' || type === 'material') return { type, value }

  warn(`未知的图标类型 "${type}"，已回退为默认图标`)
  return { type: 'material', value: 'apps' }
}

function normalizeBadges(input) {
  if (!Array.isArray(input)) return []
  return input
    .map((badge) => {
      if (typeof badge === 'string') return { label: badge.trim(), tone: 'default' }
      if (!badge || typeof badge !== 'object') return null
      const label = str(badge.label)
      if (!label) return null
      const tone = str(badge.tone) || 'default'
      if (!BADGE_TONES[tone]) warn(`未知的 badge tone "${tone}"，已按 default 处理`)
      return { label, tone: BADGE_TONES[tone] ? tone : 'default' }
    })
    .filter(Boolean)
}

function normalizeCategories(input) {
  if (!Array.isArray(input) || input.length === 0) {
    warn('config.categories 缺失或为空，暂用「全部」兜底')
    return [{ id: 'all', name: '全部', icon: 'apps' }]
  }

  const seen = new Set()
  const categories = []

  for (const item of input) {
    const id = str(item?.id)
    if (!id) {
      warn('忽略缺少 id 的分类条目', item)
      continue
    }
    if (seen.has(id)) {
      warn(`分类 id 重复：${id}`)
      continue
    }
    seen.add(id)
    categories.push({ id, name: str(item.name) || id, icon: str(item.icon) || 'label' })
  }

  return categories.length > 0 ? categories : [{ id: 'all', name: '全部', icon: 'apps' }]
}

function normalizeApps(input, categories) {
  if (!Array.isArray(input)) {
    warn('config.apps 缺失或不是数组')
    return []
  }

  const categoryIds = new Set(categories.map((cat) => cat.id))
  const seen = new Set()
  const apps = []

  for (const item of input) {
    const id = str(item?.id)
    const name = str(item?.name)

    if (!id) {
      warn('忽略缺少 id 的软件条目', item)
      continue
    }
    if (!name) {
      warn(`软件 "${id}" 缺少 name，已忽略`)
      continue
    }
    if (seen.has(id)) {
      warn(`软件 id 重复：${id}`)
      continue
    }
    seen.add(id)

    const category = str(item.category)
    if (category && !categoryIds.has(category)) {
      warn(`软件 "${id}" 使用了不存在的分类 "${category}"`)
    }

    apps.push({
      id,
      name,
      category,
      icon: normalizeIcon(item.icon),
      description: str(item.description),
      fullDescription: str(item.fullDescription) || str(item.description),
      isOpenSource: Boolean(item.isOpenSource),
      license: str(item.license),
      author: str(item.author),
      maintainer: str(item.maintainer),
      website: str(item.website),
      github: str(item.github),
      badges: normalizeBadges(item.badges),
      tags: strArray(item.tags),
      platforms: strArray(item.platforms),
      links: Array.isArray(item.links) ? item.links : []
    })
  }

  return apps
}

function normalizeConfig(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('config.json 顶层必须是一个对象')

  const site = raw.site && typeof raw.site === 'object' ? raw.site : {}
  const categories = normalizeCategories(raw.categories)
  const apps = normalizeApps(raw.apps, categories)

  return {
    site: {
      title: str(site.title),
      subtitle: str(site.subtitle),
      author: str(site.author),
      maintainer: str(site.maintainer),
      theme: ['auto', 'light', 'dark'].includes(site.theme) ? site.theme : 'auto',
      footerLinks: Array.isArray(site.footerLinks) ? site.footerLinks : []
    },
    categories,
    apps,
    getCategory(id) {
      return categories.find((cat) => cat.id === id)
    }
  }
}


function parseUrl(url) {
  try {
    return new URL(url, location.href)
  } catch {
    return null
  }
}

function inferIcon(url) {
  if (/^mailto:/i.test(url)) return 'mail'

  const parsed = parseUrl(url)
  const host = (parsed?.hostname || '').replace(/^www\./, '')
  const path = (parsed?.pathname || '').toLowerCase()
  const haystack = `${host}${path}`

  if (host === 'github.com' || host.endsWith('.github.com')) return 'code'
  if (/(^|\.)docs?\.|wiki|\/docs?\/|manual|readme/.test(haystack)) return 'article'
  if (/download|release|\.(zip|7z|tar|gz|exe|msi|dmg|pkg|apk|ipa)$/.test(haystack)) return 'download'
  if (/discord|forum|bbs|t\.me|telegram|qq\.com/.test(host)) return 'forum'
  return 'language'
}

function defaultLinkLabel(url) {
  if (/^mailto:/i.test(url)) return '邮件联系'
  const host = parseUrl(url)?.hostname?.replace(/^www\./, '') || ''
  if (!host) return '打开链接'
  if (host === 'github.com') return 'GitHub'
  return host
}


function resolveLinks(app) {
  const raw = []

  if (Array.isArray(app.links)) raw.push(...app.links)
  if (app.website) raw.push({ label: '访问网站', url: app.website, icon: 'language', variant: 'filled' })
  if (app.github) raw.push({ label: 'GitHub', url: app.github, icon: 'code' })

  const seen = new Set()
  const links = []

  for (const item of raw) {
    const url = str(typeof item === 'string' ? item : item?.url)
    if (!url || seen.has(url)) continue
    seen.add(url)

    const explicitVariant = str(item?.variant)
    if (explicitVariant && !LINK_VARIANTS.includes(explicitVariant)) {
      warn(`未知的按钮变体 "${explicitVariant}"，已忽略`)
    }

    links.push({
      label: str(item?.label) || defaultLinkLabel(url),
      url,
      icon: str(item?.icon) || inferIcon(url),
      variant: LINK_VARIANTS.includes(explicitVariant) ? explicitVariant : null
    })
  }

  return links.map((link, index) => ({
    ...link,
    variant: link.variant || (index === 0 ? 'filled' : 'tonal')
  }))
}

function openLink(url) {
  const scheme = (url.match(/^([a-z][a-z0-9+.-]*):/i) || [])[1]?.toLowerCase()
  if (scheme && scheme !== 'http' && scheme !== 'https') {
    window.location.href = url
    return
  }
  window.open(url, '_blank', 'noopener')
}

function createLinkButton({ label, icon, variant, url }) {
  return h('s-button', {
    variant,
    onclick: () => openLink(url)
  }, sIcon(icon, { slot: 'start' }), label)
}


function buildShell() {
  const themeIcon = sIcon('dark_mode')
  const themeToggle = h('s-icon-button', { id: 'theme-toggle', 'aria-label': '切换深色模式' },
    themeIcon,
    h('s-tooltip', { text: '切换外观' })
  )

  const title = h('span', { slot: 'title', text: DEFAULT_TITLE })
  const appBar = h('s-app-bar', { size: 'small' },
    sIcon('rocket_launch', { slot: 'logo' }),
    title,
    themeToggle
  )

  const subtitle = h('p', { class: 'subtitle', id: 'page-subtitle' })
  const tabsHost = h('div', { class: 'tabs-wrap', id: 'tabs-host' })
  const grid = h('section', { class: 'app-grid', id: 'app-grid', 'aria-live': 'polite' })

  const emptyIcon = sIcon('search_off', { slot: 'icon' })
  const emptyText = h('span', { text: '该分类暂无软件' })
  const empty = h('s-empty', { id: 'empty-state', hidden: true }, emptyIcon, emptyText)

  const footer = h('footer', { class: 'page-footer', id: 'page-footer', hidden: true })
  const content = h('main', { class: 'content' }, subtitle, tabsHost, grid, empty, footer)

  const dialogTitle = h('span', { slot: 'title' })
  const dialogIcon = h('div', { class: 'detail-icon' })
  const dialogChips = h('div', { class: 'detail-chips' })
  const dialogTags = h('div', { class: 'detail-tags' })
  const dialogDesc = h('p', { class: 'detail-desc' })
  const dialogLinks = h('div', { class: 'detail-links' })
  const dialog = h('s-dialog', { id: 'detail-dialog' },
    dialogTitle,
    h('div', { slot: 'text', class: 'detail' },
      h('div', { class: 'detail-head' }, dialogIcon, dialogChips),
      dialogDesc,
      dialogTags,
      dialogLinks
    ),
    h('s-button', { slot: 'action', variant: 'text', text: '关闭' })
  )

  const page = h('s-page', { id: 'page' },
    h('header', { class: 'app-header' }, appBar),
    content,
    dialog
  )

  return {
    page, title, subtitle, tabsHost, grid, empty, emptyText, footer,
    dialog, dialogTitle, dialogIcon, dialogChips, dialogTags, dialogDesc, dialogLinks,
    themeToggle, themeIcon
  }
}

function createAppIcon(app) {
  const icon = app.icon

  if (icon.type === 'material') return sIcon(icon.value, { class: 'app-icon' })

  if (icon.type === 'emoji') return h('span', { class: 'app-icon-emoji', text: icon.value })

  // 不使用 loading="lazy" 浏览器对懒加载图片的占位替换会触发 error 事件
  const img = h('img', { class: 'app-icon-img', src: icon.value, alt: '', decoding: 'async' })
  img.addEventListener('error', () => {
    img.replaceWith(sIcon('apps', { class: 'app-icon' }))
  }, { once: true })
  return img
}


function createChip({ icon, label, variant = 'outlined', className, tone }) {
  const classes = [className, tone ? BADGE_TONES[tone] : ''].filter(Boolean).join(' ')
  const chip = h('s-chip', { variant, class: classes }, label)
  if (icon) chip.prepend(sIcon(icon, { slot: 'start' }))
  return chip
}

function createOpenSourceChip(app) {
  return app.isOpenSource
    ? createChip({ icon: 'lock_open', label: '开源', variant: 'elevated', className: 'chip-open' })
    : createChip({ icon: 'lock', label: '闭源', variant: 'elevated', className: 'chip-closed' })
}

function createBadgeChip(badge) {
  return createChip({ label: badge.label, variant: 'elevated', tone: badge.tone })
}

function renderTabs() {
  const tabs = h('s-tab')
  dom.tabsHost.append(tabs)

  for (const cat of config.categories) {
    tabs.append(
      h('s-tab-item', { value: cat.id },
        sIcon(cat.icon, { slot: 'icon' }),
        h('div', { slot: 'text', text: cat.name })
      )
    )
  }

  const hasAll = config.categories.some((cat) => cat.id === 'all')
  tabs.value = hasAll ? 'all' : (config.categories[0]?.id ?? '')
  tabs.addEventListener('change', () => renderCards(tabs.value || 'all'))
}

function createCard(app) {
  const meta = h('div', { class: 'card-meta' }, createOpenSourceChip(app))

  const category = config.getCategory(app.category)
  if (category) meta.append(createChip({ icon: category.icon, label: category.name }))

  for (const badge of app.badges.slice(0, 2)) meta.append(createBadgeChip(badge))

  const card = h('s-card', { class: 'app-card', variant: 'filled', clickable: true },
    h('div', { class: 'card-inner' },
      h('div', { class: 'card-icon' }, createAppIcon(app)),
      h('div', { class: 'card-body' },
        h('h2', { class: 'card-title', text: app.name }),
        h('p', { class: 'card-desc', text: app.description }),
        meta
      )
    )
  )

  card.addEventListener('click', () => openDetail(app))
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') openDetail(app)
  })

  return card
}

function renderCards(categoryId) {
  const apps = !categoryId || categoryId === 'all'
    ? config.apps
    : config.apps.filter((app) => app.category === categoryId)

  if (apps.length === 0) {
    dom.grid.replaceChildren()
    dom.empty.hidden = false
    return
  }

  dom.empty.hidden = true
  dom.grid.replaceChildren(...apps.map(createCard))
}

function buildDetailChips(app) {
  const chips = [createOpenSourceChip(app)]

  if (app.isOpenSource && app.license) {
    chips.push(createChip({ icon: 'description', label: app.license }))
  }

  for (const badge of app.badges) chips.push(createBadgeChip(badge))

  for (const platform of app.platforms) {
    chips.push(createChip({ icon: 'devices', label: platform }))
  }

  if (app.author && app.maintainer && app.author === app.maintainer) {
    chips.push(createChip({ icon: 'person', label: app.author }))
  } else {
    if (app.author) chips.push(createChip({ icon: 'person', label: `作者：${app.author}` }))
    if (app.maintainer) chips.push(createChip({ icon: 'manage_accounts', label: `维护者：${app.maintainer}` }))
  }

  return chips
}

function openDetail(app) {
  dom.dialogTitle.textContent = app.name
  dom.dialogIcon.replaceChildren(createAppIcon(app))
  dom.dialogChips.replaceChildren(...buildDetailChips(app))
  dom.dialogDesc.textContent = app.fullDescription

  dom.dialogTags.replaceChildren(
    ...app.tags.map((tag) => createChip({ label: tag }))
  )
  dom.dialogTags.hidden = app.tags.length === 0

  const links = resolveLinks(app)
  dom.dialogLinks.replaceChildren(...links.map(createLinkButton))
  dom.dialogLinks.hidden = links.length === 0

  dom.dialog.opened = true
}

function renderFooter() {
  const site = config.site
  const parts = []

  if (site.author) parts.push(`作者：${site.author}`)
  if (site.maintainer) parts.push(`主维护者：${site.maintainer}`)

  const footerLinks = site.footerLinks
    .map((item) => {
      const url = str(typeof item === 'string' ? item : item?.url)
      if (!url) return null
      return { label: str(item?.label) || defaultLinkLabel(url), url }
    })
    .filter(Boolean)

  if (parts.length === 0 && footerLinks.length === 0) {
    dom.footer.hidden = true
    return
  }

  const children = []
  if (parts.length > 0) children.push(h('span', { text: parts.join('　|　') }))
  if (footerLinks.length > 0) {
    children.push(
      h('span', { class: 'footer-links' },
        ...footerLinks.map((link) => h('s-button', {
          variant: 'text',
          size: 'small',
          onclick: () => openLink(link.url)
        }, link.label))
      )
    )
  }

  dom.footer.replaceChildren(...children)
  dom.footer.hidden = false
}

function applySiteInfo() {
  const site = config.site
  document.title = site.title || DEFAULT_TITLE
  dom.title.textContent = site.title || DEFAULT_TITLE
  dom.subtitle.textContent = site.subtitle
  renderFooter()
}

function isDark() {
  return dom.page.hasAttribute('dark')
}

function syncThemeIcon() {
  const dark = isDark()
  dom.themeIcon.innerHTML = iconSvg(dark ? 'light_mode' : 'dark_mode')
  dom.themeToggle.setAttribute('aria-label', dark ? '切换到浅色模式' : '切换到深色模式')
}

function applySiteTheme() {
  if (localStorage.getItem(THEME_KEY)) return
  const theme = config.site.theme
  if (theme && theme !== 'auto' && dom.page.theme !== theme) dom.page.theme = theme
  syncThemeIcon()
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark') dom.page.theme = saved

  syncThemeIcon()

  dom.themeToggle.addEventListener('click', async () => {
    const next = isDark() ? 'light' : 'dark'
    if (typeof dom.page.toggle === 'function') {
      await dom.page.toggle(next, dom.themeToggle)
    } else {
      dom.page.theme = next
    }
    localStorage.setItem(THEME_KEY, next)
    syncThemeIcon()
  })
}

function showError(message) {
  dom.emptyText.textContent = message
  dom.empty.hidden = false
  dom.grid.replaceChildren()
}


async function init() {
  dom = buildShell()
  document.getElementById('app').append(dom.page)

  initTheme()

  try {
    const res = await fetch('./config.json', { cache: 'no-cache' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    config = normalizeConfig(await res.json())
  } catch (error) {
    showError('配置加载失败，请稍后重试')
    console.error('[TouchFish Supported] 无法加载 config.json', error)
    return
  }

  applySiteInfo()
  applySiteTheme()
  renderTabs()
  renderCards('all')
}

init()
