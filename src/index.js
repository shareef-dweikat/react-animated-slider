import React from 'react';

const PREVIOUS = 'previous';
const NEXT = 'next';

export const HORIZONTAL = 'horizontal';
export const VERTICAL = 'vertical';

const DEFAULT_CLASSNAMES = {
	previousButton: 'previousButton',
	nextButton: 'nextButton',
	buttonDisabled: 'disabled',
	track: 'track',
	slide: 'slide',
	hidden: 'hidden',
	previous: 'previous',
	current: 'current',
	next: 'next',
	animateIn: 'animateIn',
	animateOut: 'animateOut',
};
const DEFAULT_DURATION = 2000;

class Slider extends React.PureComponent {
	constructor(props) {
		super(props);
		const {
			slideIndex = 0,
			direction = HORIZONTAL,
		} = this.props;
		this.state = {
			currentSlideIndex: slideIndex,
			animating: false,
		};
		this.direction = direction;
		this.swipeProperty = direction === HORIZONTAL ? 'left' : 'top';
		this.swipeEventProperty = direction === HORIZONTAL ? 'clientX' : 'clientY';
	}

	componentDidMount() {
		this.setupAutoplay();
	}

	componentWillUnmount() {
		this.stopAutoplay();
		if (this.animationTimerId) {
			clearTimeout(this.animationTimerId);
		}
	}

	static getDerivedStateFromProps(props, state) {
		const slideCount = React.Children.count(props.children);
		if (state.currentSlideIndex >= slideCount) {
			return { currentSlideIndex: 0 };
		}
		return null;
	}

	setupAutoplay = () => {
		if (this.props.autoplay && !this.isMouseOver) {
			this.stopAutoplay();
			this.autoplayTimerId = setInterval(
				this.next,
				parseInt(this.props.autoplay, 10),
			);
		}
	}

	stopAutoplay = () => {
		if (this.autoplayTimerId) {
			clearInterval(this.autoplayTimerId);
		}
	}

	onAnimationEnd = () => {
		this.setState({
			currentSlideIndex: this.nextSlideIndex,
			animating: false,
			animation: undefined,
		});
		this.setupAutoplay();
		if (typeof this.props.onSlideChange === 'function') {
			this.props.onSlideChange({ slideIndex: this.nextSlideIndex });
		}
	};

	isDisabled = () => this.slideCount < 2 ||
		this.state.animating ||
		this.props.disabled;

	isInfinite = () => this.slideCount > 2 && this.props.infinite !== false;

	canGoPrevious = () => this.isInfinite() || this.state.currentSlideIndex > 0;

	canGoNext = () => this.isInfinite() || this.state.currentSlideIndex < this.slideCount - 1;

	goTo = (index, animation) => {
		if (this.isDisabled()) return;
		this.nextSlideIndex = index;
		this.setState({ animating: true, animation });
		const timeout = this.props.duration || DEFAULT_DURATION;
		this.animationTimerId = setTimeout(this.onAnimationEnd, timeout);
	};

	previous = () => {
		if (!this.canGoPrevious()) return;
		const nextSlideIndex = this.state.currentSlideIndex - 1;
		const actualNextSlide = nextSlideIndex >= 0 ? nextSlideIndex : this.slideCount - 1;
		this.goTo(actualNextSlide, PREVIOUS);
	};

	next = () => {
		if (!this.canGoNext()) return;
		const nextSlideIndex = (this.state.currentSlideIndex + 1) % this.slideCount;
		this.goTo(nextSlideIndex, NEXT);
	};

	getSlideClass = (index) => {
		const {
			currentSlideIndex,
			animation,
		} = this.state;
		const classNames = this.getClassNames();
		const lastSlideIndex = this.slideCount - 1;
		if (index === currentSlideIndex) {
			if (animation) return `${classNames.animateOut} ${classNames[animation]}`;
			return classNames.current;
		}
		if (this.slideCount === 2) {
			if (animation) return `${classNames.animateIn} ${classNames[animation]}`;
			return index < currentSlideIndex ? classNames.previous : classNames.next;
		}
		if (
			index === currentSlideIndex - 1 ||
			(currentSlideIndex === 0 && index === lastSlideIndex)
		) {
			if (animation === PREVIOUS) return `${classNames.animateIn} ${classNames.previous}`;
			if (animation === NEXT) return classNames.hidden;
			return classNames.previous;
		}
		if (
			index === currentSlideIndex + 1 ||
			(index === 0 && currentSlideIndex === lastSlideIndex)
		) {
			if (animation === NEXT) return `${classNames.animateIn} ${classNames.next}`;
			if (animation === PREVIOUS) return classNames.hidden;
			return classNames.next;
		}
		return classNames.hidden;
	};

	/* eslint-disable lines-between-class-members */
	isSwiping = false;
	sliderRef;
	pageStartPosition;

	currentElement;
	currentElementStartPosition;
	currentElementPosition;
	previousElement;
	previousElementStartPosition;
	previousElementPosition;
	nextElement;
	nextElementStartPosition;
	nextElementPosition;
	/* eslint-enable lines-between-class-members */

	handleTouchStart = (e) => {
		if (this.isDisabled()) return;
		this.stopAutoplay();
		const { current, previous, next } = this.getClassNames();
		const touch = e.touches[0];
		this.isSwiping = true;
		this.pageStartPosition = touch[this.swipeEventProperty];
		/* eslint-disable prefer-destructuring */
		this.currentElement = this.sliderRef.getElementsByClassName(current)[0];
		this.previousElement = this.sliderRef.getElementsByClassName(previous)[0];
		this.nextElement = this.sliderRef.getElementsByClassName(next)[0];
		/* eslint-enable prefer-destructuring */
		const touchDelta = this.currentElement.getBoundingClientRect()[this.swipeProperty];
		this.currentElementStartPosition = 0;
		this.currentElementPosition = 0;
		this.currentElement.style.transition = 'none';
		if (this.previousElement) {
			this.previousElement.style.transition = 'none';
			this.previousElement.style.visibility = 'visible';
			// eslint-disable-next-line max-len
			this.previousElementStartPosition = this.previousElement.getBoundingClientRect()[this.swipeProperty] - touchDelta;
		}
		if (this.nextElement) {
			this.nextElement.style.visibility = 'visible';
			this.nextElement.style.transition = 'none';
			// eslint-disable-next-line max-len
			this.nextElementStartPosition = this.nextElement.getBoundingClientRect()[this.swipeProperty] - touchDelta;
		}
	};

	animating = false;

	handleTouchMove = (e) => {
		e.preventDefault();
		this.animating = this.animating ||
			requestAnimationFrame(() => {
				if (!this.isSwiping) {
					this.animating = false;
					return;
				}
				const touch = e.touches[0];
				const newLeft = touch[this.swipeEventProperty] - this.pageStartPosition;
				this.currentElementPosition = this.currentElementStartPosition + newLeft;
				this.currentElement.style[this.swipeProperty] = `${this.currentElementPosition}px`;
				if (this.previousElement) {
					this.previousElementPosition = this.previousElementStartPosition + newLeft;
					this.previousElement.style[this.swipeProperty] = `${this.previousElementPosition}px`;
				}
				if (this.nextElement) {
					this.nextElementPosition = this.nextElementStartPosition + newLeft;
					this.nextElement.style[this.swipeProperty] = `${this.nextElementPosition}px`;
				}
				this.animating = false;
			});
	};

	handleTouchEnd = () => {
		this.animating = false;
		this.isSwiping = false;
		this.currentElement.style.removeProperty(this.swipeProperty);
		this.currentElement.style.removeProperty('transition');
		if (this.previousElement) {
			this.previousElement.style.removeProperty('visibility');
			this.previousElement.style.removeProperty('transition');
			this.previousElement.style.removeProperty(this.swipeProperty);
		}
		if (this.nextElement) {
			this.nextElement.style.removeProperty('visibility');
			this.nextElement.style.removeProperty('transition');
			this.nextElement.style.removeProperty(this.swipeProperty);
		}
		const touchDelta = this.currentElementStartPosition - this.currentElementPosition;
		const minSwipeOffset = this.props.minSwipeOffset || 15;
		if (Math.abs(touchDelta) > minSwipeOffset) {
			if (touchDelta < 0) {
				this.previous();
			} else {
				this.next();
			}
		} else {
			this.setupAutoplay();
		}
	};

	getClassNames = () => ({ ...DEFAULT_CLASSNAMES, ...this.props.classNames });

	initTouchEvents = (sliderRef) => {
		if (this.isDisabled() || !sliderRef) return;
		this.sliderRef = sliderRef;
		this.sliderRef.addEventListener('touchstart', this.handleTouchStart);
		this.sliderRef.addEventListener('touchmove', this.handleTouchMove, {
			passive: false,
		});
		this.sliderRef.addEventListener('touchend', this.handleTouchEnd);
	}

	handleMouseOver = () => {
		this.isMouseOver = true;
		this.stopAutoplay();
	}

	handleMouseOut = () => {
		this.isMouseOver = false;
		this.setupAutoplay();
	}

	render() {
		this.slideCount = React.Children.count(this.props.children);
		const {
			children,
			className = 'slider',
			previousButton = <div><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M15.293 3.293 6.586 12l8.707 8.707 1.414-1.414L9.414 12l7.293-7.293-1.414-1.414z"/></svg></div>,
			nextButton = <div><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M7.293 4.707 14.586 12l-7.293 7.293 1.414 1.414L17.414 12 8.707 3.293 7.293 4.707z"/></svg></div>,
			touchDisabled,
			autoplay,
		} = this.props;
		const classNames = this.getClassNames();
		const isDisabled = this.isDisabled();
		return (
			<div
				className={classNames.slider || className}
				{...!touchDisabled && { ref: this.initTouchEvents }}
				{...autoplay && {
					onMouseOver: this.handleMouseOver,
					onMouseOut: this.handleMouseOut,
				}}
			>
				<a
					onClick={this.previous}
					className={`${classNames.previousButton}${isDisabled || !this.canGoPrevious() ? ` ${classNames.buttonDisabled}` : ''}`}
				>
					{previousButton}
				</a>
				<a
					onClick={this.next}
					className={`${classNames.nextButton}${isDisabled || !this.canGoNext() ? ` ${classNames.buttonDisabled}` : ''}`}
				>
					{nextButton}
				</a>
				<div className={classNames.track}>
					{React.Children.map(children, (item, index) => (
						React.cloneElement(item, {
							key: index,
							className: [classNames.slide, this.getSlideClass(index), item.props.className].filter(v => v).join(' '),
						})
					))}
				</div>
			</div>
		);
	}
}
export default Slider;
