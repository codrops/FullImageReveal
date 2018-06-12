/**
 * demo.js
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2018, Codrops
 * http://www.codrops.com
 */
{
    // Preload all the images in the page..
    imagesLoaded(document.querySelectorAll(['.fullview__item', '.grid__item-bg']), {background: true}, () => document.body.classList.remove('loading'));

    const getRandomFloat = (min, max) => (Math.random() * (max - min) + min).toFixed(2);

    // from http://www.quirksmode.org/js/events_properties.html#position
	const getMousePos = (e) => {
        let posx = 0;
        let posy = 0;
		if (!e) e = window.event;
		if (e.pageX || e.pageY) 	{
			posx = e.pageX;
			posy = e.pageY;
		}
		else if (e.clientX || e.clientY) 	{
			posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}
		return { x : posx, y : posy }
	};
    
    class GridItem {
        constructor(el) {
            this.DOM = {el: el};
            this.DOM.inner = Array.from(this.DOM.el.children);
        }
        toggle(action) {
            this.DOM.inner.forEach((inner) => {
                const speed = getRandomFloat(1,1.5);
                TweenMax.to(inner, speed, {
                    delay: 0.2,
                    ease: 'Quint.easeInOut',
                    y: action === 'hide' ? this.constructor.name === 'Thumb' ? -1 * winsize.height - 30 : -1 * winsize.height - 30 + inner.offsetHeight/2 : 0
                });

                // scale the "more/back" box as it moves.
                if ( this.constructor.name !== 'Thumb' ) {
                    TweenMax.to(inner, speed/2, {
                        delay: 0.2,
                        ease: 'Quint.easeIn',
                        scaleY: 2.5
                    });
                    TweenMax.to(inner, speed/2, {
                        delay: 0.2+speed/2,
                        ease: 'Quint.easeOut',
                        scaleY: 1
                    });
                }
            });

            // the more box text animation (switch from "more" to "back").
            if ( this.constructor.name === 'GridItem' ) {
                TweenMax.to(this.DOM.el.querySelector('.grid__toggle-more'), action === 'hide' ? 0.2 : 0.4, {
                    delay: action === 'hide' ? 0.2 : 1,
                    ease: action === 'hide' ? 'Quad.easeIn' : 'Quad.easeOut',
                    startAt: action === 'hide' ? {} : {opacity: 0, y: '-150%'},
                    y: action === 'hide' ? '-150%' : '0%',
                    opacity: action === 'hide' ? 0 : 1
                });

                TweenMax.to(this.DOM.el.querySelector('.grid__toggle-back'), action === 'hide' ? 0.4 : 0.2, {
                    delay: action === 'hide' ? 1 : 0.2,
                    ease: action === 'hide' ? 'Quad.easeOut' : 'Quad.easeIn',
                    startAt: action === 'hide' ? {opacity: 0, y: '50%'} : {},
                    y: action === 'hide' ? '0%' : '50%',
                    opacity: action === 'hide' ? 1 : 0
                });
            }
        }
    }

    class Thumb extends GridItem {
        constructor(el) {
            super(el);
            this.DOM.tilt = {};
            this.DOM.tilt.title = this.DOM.el.querySelector('.grid__item-title');
            this.DOM.tilt.number = this.DOM.el.querySelector('.grid__item-number');
            this.DOM.tilt.img = this.DOM.el.querySelector('.grid__item-imgwrap > .grid__item-bg');

            this.tiltconfig = {   
                title: {translation : {x: [-8,8], y: [4,-4]}},
                number: {translation : {x: [-5,5], y: [-12,0]}},
                img: {translation : {x: [-8,8], y: [6,-6]}}
            };
            this.initEvents();
        }
        // tilt when mouse moving a thumb.
        initEvents() {
            let enter = false;
            this.mouseenterFn = () => {
                if ( enter ) {
                    enter = false;
                };
                clearTimeout(this.mousetime);
                this.mousetime = setTimeout(() => enter = true, 80);
            };
            this.mousemoveFn = (ev) => requestAnimationFrame(() => {
                if ( !enter ) return;
                this.tilt(ev);
            });
            this.mouseleaveFn = () => requestAnimationFrame(() => {
                if ( !enter  || !allowTilt ) return;
                enter = false;
                clearTimeout(this.mousetime);
                this.resetTilt();
            });
            this.DOM.el.addEventListener('mouseenter', this.mouseenterFn);
            this.DOM.el.addEventListener('mousemove', this.mousemoveFn);
            this.DOM.el.addEventListener('mouseleave', this.mouseleaveFn);
        }
        tilt(ev) {
            if ( !allowTilt ) return;
            const mousepos = getMousePos(ev);
            // Document scrolls.
            const docScrolls = {
                left : document.body.scrollLeft + document.documentElement.scrollLeft, 
                top : document.body.scrollTop + document.documentElement.scrollTop
            };
            const bounds = this.DOM.el.getBoundingClientRect();
            // Mouse position relative to the main element (this.DOM.el).
            const relmousepos = { 
                x : mousepos.x - bounds.left - docScrolls.left, 
                y : mousepos.y - bounds.top - docScrolls.top 
            };
            
            // Movement settings for the tilt elements.
            for (let key in this.DOM.tilt) {
                let t = this.tiltconfig[key].translation;
                TweenMax.to(this.DOM.tilt[key], 1, {
                    //ease: 'Expo.easeInOut',
                    x: (t.x[1]-t.x[0])/bounds.width*relmousepos.x + t.x[0],
                    y: (t.y[1]-t.y[0])/bounds.height*relmousepos.y + t.y[0]
                });
            }
        }
        // mouseleave: reset positions.
        resetTilt() {
            for (let key in this.DOM.tilt ) {
                TweenMax.to(this.DOM.tilt[key], 2, {
                    x: 0,
                    y: 0
                });
            }
        }
    }

    class Grid {
        constructor() {
            this.DOM = {grid: document.querySelector('.grid--thumbs')};
            // the 4 thumbs
            this.DOM.thumbs = Array.from(this.DOM.grid.querySelectorAll('.grid__item:not(.grid__item--more)'));
            this.thumbs = [];
            this.DOM.thumbs.forEach((thumb) => this.thumbs.push(new Thumb(thumb)));
            // the more/back box
            this.DOM.moreCtrl = this.DOM.grid.querySelector('.grid__item--more');
            const more = new GridItem(this.DOM.moreCtrl);
            // all the elements that are going to move up/down (thumbs + more/back button)
            this.movable = [...this.thumbs,more];
            // the colorful revealer element/panel that appears behind the images when showing/hiding a project
            this.DOM.revealer = document.querySelector('.revealer');
            // the fullview container and its items
            this.DOM.fullview = document.querySelector('.fullview');
            this.DOM.fullviewItems = this.DOM.fullview.querySelectorAll('.fullview__item');
            // current thumb/project index
            this.current = -1;
            // init/bind events
            this.initEvents();
        }
        initEvents() {
            // clicking a thumb will trigger the animation (show the project).
            this.DOM.thumbs.forEach((thumb, pos) => {
                thumb.addEventListener('click', () => {
                    this.current = pos;
                    this.showProject();
                });
            });

            // clicking the back button (the more/back box) will hide the project and reveal back the grid.
            this.DOM.moreCtrl.addEventListener('click', () => {
                if ( !this.isGridHidden ) return;
                this.hideProject();
            });

            // when resizing the window we need to reset the grid items translation positions (if the fullview is shown).
            window.addEventListener('resize', () => {
                winsize = {width: window.innerWidth, height: window.innerHeight};
                if ( this.isGridHidden ) {
                    this.movable.forEach((item) => {
                        Array.from(item.DOM.el.children).forEach((child) => {
                            TweenMax.set(child, {
                                y: item.constructor.name === 'Thumb' ? -1 * winsize.height - 30 : -1 * winsize.height - 30 + child.offsetHeight/2
                            });
                        }); 
                    });
                }
            });
        }
        showProject() {
            this.toggleProject('show');
        }
        hideProject() {
            this.toggleProject('hide');
        }
        toggleProject(action) {
            if ( this.isAnimating ) return;
            this.isAnimating = true;
            this.isGridHidden = action === 'show';
            allowTilt = !this.isGridHidden;
            this.showRevealer().then(() => {
                this.DOM.fullviewItems[this.current].style.opacity = this.isGridHidden ? 1 : 0;
                this.DOM.fullview.style.opacity = this.isGridHidden ? 1 : 0;
                this.DOM.fullview.style.pointerEvents = this.isGridHidden ? 'auto' : 'none';
                this.hideRevealer(this.isGridHidden ? 'up' : 'down');
                this.isAnimating = false;
            });
            this.movable.forEach((item) => {
                item.toggle(this.isGridHidden ? 'hide' : 'show');
                item.DOM.el.style.pointerEvents = this.isGridHidden ? 'none' : 'auto';
            });
        }
        showRevealer() {
            return this.toggleRevealer('show');
        }
        hideRevealer(dir) {
            return this.toggleRevealer('hide', dir);
        }
        toggleRevealer(action, dir) {
            return new Promise((resolve, reject) => {
                // change revealer color
                if ( action === 'show' ) {
                    this.DOM.revealer.style.backgroundColor = this.movable[this.current].DOM.el.dataset.revealerColor;
                }
                // animate the revealer up or down.
                TweenMax.to( this.DOM.revealer, action === 'show' ? 1 : 1, {
                    ease: action === 'show' ? 'Quint.easeInOut' : 'Quint.easeOut',
                    y: action === 'show' ? '-100%' : dir === 'up' ? '-200%' : '0%',
                    onComplete: resolve
                });
            });
        }
    }

    // window´s size.
    let winsize = {width: window.innerWidth, height: window.innerHeight};
    // mousemove on the thumbs.
    let allowTilt = true;
    new Grid();
}
