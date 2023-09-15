const defaultOptions = {
  draggable: false,
  classNames: {
    wrapper: 'custom-scrollbar',
    draggable: 'custom-scrollbar_draggable',
    dragging: 'custom-scrollbar_dragging',
    mask: 'custom-scrollbar__mask',
    content: 'custom-scrollbar__content',
    trackX: 'custom-scrollbar__track-x',
    trackY: 'custom-scrollbar__track-y',
    thumbX: 'custom-scrollbar__thumb-x',
    thumbY: 'custom-scrollbar__thumb-y',
  },
}

const getScrollbarSizes = () => {
  const div = document.createElement('div')
  div.classList.add('custom-scrollbar__content')

  div.style.width = '50px'
  div.style.height = '50px'
  div.style.overflow = 'scroll'
  div.style.visibility = 'hidden'

  document.body.appendChild(div)

  const width = div.offsetWidth - div.clientWidth
  const height = div.offsetHeight - div.clientHeight

  div.remove()

  return { width, height }
}

const classNamesToSelector = (classNames) => {
  return `.${classNames.split(' ').filter(Boolean).join('.')}`
}

const findChild = (wrapper, classNames) => {
  return wrapper.querySelector(classNamesToSelector(classNames))
}

class Scrollbar {
  constructor (wrapper, options = {}) {
    this.options = { ...defaultOptions, ...options }

    this.wrapper = wrapper  
    this.trackX = findChild(wrapper, this.options.classNames.trackX)
    this.trackY = findChild(wrapper, this.options.classNames.trackY)
    this.thumbX = findChild(wrapper, this.options.classNames.thumbX)
    this.thumbY = findChild(wrapper, this.options.classNames.thumbY)
    this.mask = findChild(wrapper, this.options.classNames.mask)
    this.content = findChild(wrapper, this.options.classNames.content)

    this.wrapper.addEventListener('pointerdown', this.onDragStart)
    this.content.addEventListener('scroll', this.render)
    window.addEventListener('resize', this.render)

    this.scrollSizes = getScrollbarSizes()

    this.resizeObserver = new ResizeObserver(this.render)
    this.resizeObserver.observe(this.wrapper)
    this.resizeObserver.observe(this.mask)
    this.resizeObserver.observe(this.content)
    this.mutationObserver = new MutationObserver(this.render)
    this.mutationObserver.observe(this.wrapper, { childList: true })

    this.pointerPos = { x: 0, y: 0 }
    this.scrollPos = { top: 0, left: 0 }
    this.path = []

    this.setDraggable(this.options.draggable)

    this.render()
  }

  setDraggable (draggable) {
    const action = draggable ? 'add' : 'remove'

    this.options.draggable = draggable
    this.wrapper.classList[action](this.options.classNames.draggable)
  }

  setDragging (dragging) {
    const action = dragging ? 'add' : 'remove'

    this.options.dragging = dragging
    this.wrapper.classList[action](this.options.classNames.dragging)
  }

  onDragStart = (event) => {
    if (event.pointerType === 'touch') {
      return
    }

    const { scrollTop, scrollLeft } = this.content

    document.addEventListener('pointermove', this.onDragMove)
    document.addEventListener('pointerup', this.onDragEnd)

    this.pointerPos = { x: event.pageX, y: event.pageY }
    this.scrollPos = { top: scrollTop, left: scrollLeft }
    this.path = event.composedPath()

    if (this.options.draggable) {
      this.setDragging(true)
    }
  }

  onDragMove = (event) => {
    const { scrollWidth, scrollHeight } = this.content
    const { offsetWidth, offsetHeight } = this.mask
    const { x, y } = this.pointerPos
    const { top, left } = this.scrollPos

    const xRatio = offsetWidth / scrollWidth
    const yRatio = offsetHeight / scrollHeight

    if (this.options.draggable && this.path.includes(this.content)) {
      this.content.scrollTo(left + x - event.pageX, top + y - event.pageY)
    }

    if (this.path.includes(this.thumbX)) {
      this.content.scrollTo({ left: left + ((event.pageX - x) / xRatio) })
    }

    if (this.path.includes(this.thumbY)) {
      this.content.scrollTo({ top: top + ((event.pageY - y) / yRatio) })
    }
  }

  onDragEnd = () => {
    document.removeEventListener('pointermove', this.onDragMove)
    document.removeEventListener('pointerup', this.onDragEnd)

    this.setDragging(false)
  }

  render = () => {
    const { scrollWidth, scrollHeight, scrollTop, scrollLeft } = this.content
    const { offsetWidth, offsetHeight } = this.mask
    const isOverflowX = scrollWidth > offsetWidth
    const isOverflowY = scrollHeight > offsetHeight

    this.trackX.style.display = isOverflowX ? '' : 'none'
    this.trackY.style.display = isOverflowY ? '' : 'none'

    if (isOverflowX) {
      this.content.style.height = `calc(100% + ${this.scrollSizes.height}px)`
    }

    if (isOverflowY) {
      this.content.style.width = `calc(100% + ${this.scrollSizes.width}px)`
    }

    this.content.style.overflow = 'auto'

    const xRatio = offsetWidth / scrollWidth
    const yRatio = offsetHeight / scrollHeight

    this.thumbX.style.width = `${offsetWidth * xRatio}px`
    this.thumbX.style.left = `${scrollLeft * xRatio}px`
    this.thumbY.style.height = `${offsetHeight * yRatio}px`
    this.thumbY.style.top = `${scrollTop * yRatio}px`
  }

  destroy () {
    this.resizeObserver.disconnect()
    this.mutationObserver.disconnect()

    window.removeEventListener('resize', this.render)
    document.removeEventListener('pointermove', this.onDragMove)
    document.removeEventListener('pointerup', this.onDragEnd)
    this.wrapper.removeEventListener('pointerdown', this.onDragStart)
    this.content.removeEventListener('scroll', this.render)
  }
}
