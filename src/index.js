
import "@babel/polyfill";
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import 'whatwg-fetch';
// const humanizeDuration = require('humanize-duration');
import humanizeDuration from 'humanize-duration';
import moment from 'moment';
import './index.scss';

class ActivityItem extends React.Component {
	constructor (props) {
		super(props)

		this.state = {
			pk: props.pk,
			pending: false,
			lastTime: props.lastTime,
			nextTime: props.nextTime
		}
	}

	getDuration() {
		let duration = Math.round(this.state.nextTime) * 1000 - (Math.round(Date.now() / 1000) * 1000);

		

		if (duration > 0) {
			// return 'Due in ' + humanizeDuration(duration, {largest: 2});
			let m = moment.unix(this.state.nextTime).calendar();
			return `Due ${m}`; 
		} else {
			return '';
		}


	}

	getStatusClass() {
		let classes = 'activity item';
		if (this.state.pending) {
			classes += ' pulseBox ';
		}
		let now = (Date.now() / 1000);
		if (this.state.nextTime < now || typeof this.state.nextTime !== 'number') {
			classes += ' bad ';
		} else if (this.state.nextTime > now &&  this.state.nextTime < now + 21600 ) {
			classes += ' soon ';
		} else {
			classes += ' good ';
		}
		return classes;
	}

	getLastDate() {
		if (this.state.lastTime) {
			let d = new Date(this.state.lastTime * 1000);
			// let m = moment(d).format('h:mm A');
			let m = moment(d).fromNow();
			return m;
		} else {
			return '';
		}
		
	}
	
	markDone(item, e) {
		this.setState({pending: true});
		window.fetch('/api/update', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'

			},
			body: JSON.stringify({
				pk: this.state.pk
			})
		}).then(response => {
			return response.json();
		}).then(json => {
			this.setState({pending: false, lastTime: json['time'], nextTime: json['next_time']});
		});
	}

	render () {
		return (
			<div className={this.getStatusClass()} id={this.state.pk} key={this.props.pk} onClick={(e) => this.markDone(this, e)}>
				<div className="item-content">
					<div className="title">{this.props.activityText}</div>
					<div>{this.getLastDate()}</div>
					<div>{this.getDuration()}</div>
				</div>
			</div>
		);
	}
}

class ActivityList extends React.Component {
	constructor (props) {
		super(props)

		this.intervalID = 0;

		this.state = {
			items: this.props.items,
			category: this.props.category
		}
	}
	

	render () {
		const rows = [];
		if (this.state.items.length > 0){
			// this.state.items.forEach((item) => {
			// 	rows.push(<ActivityItem activityText={item.activity_text} lastTime={item.last_time} pk={item.pk} ></ActivityItem>);
			// });
			return (<>{this.state.items.map((item, index) => <ActivityItem activityText={item.activity_text} lastTime={item.last_checkin} nextTime={item.next_checkin} pk={item.pk} key={index} ></ActivityItem>)}</>)
		} else {
			return (<div>Loading..</div>)
		}

		// return (<div className="container">{rows.map(item => <React.Fragment>{item}</React.Fragment>)}</div>)
	}

	pollData () {
		window.fetch('/api/category.json/' + this.state.category + '?' + Date.now())
		  .then(response => response.json())
		  .then(items => this.setState({ items }));
	}

	componentDidMount() {
		this.pollData();
		this.intervalID = setInterval(() => this.pollData(), 5000);
		console.log
	}
	componentWillUnmount() {
		console.log('unmounting ', this.intervalID);
		clearInterval(this.intervalID);
	}
}

class CategoryItem extends React.Component {
	constructor (props) {
		super(props)
		this.loadCategory = this.loadCategory.bind(this);
	}

	loadCategory () {
		this.props.handleCategorySelect(this.props.pk);
	}

	render() {
		return (<div className="item" onClick={this.loadCategory}>{this.props.name}</div>)
	}
}

class CategoryList extends React.Component {
	constructor (props) {
		super(props);

		this.state = {
			categories : this.props.categories,
			selectedCategory: null
		};

		this.handleCategorySelect = this.handleCategorySelect.bind(this);
	}

	handleCategorySelect (category) {
		this.props.handleCategorySelect(category);
	}

	


	render () {
		if (this.state.categories.length > 0) {
			return (<>{this.state.categories.map((item, index) => <CategoryItem pk={item.pk} name={item.name} key={item.pk} handleCategorySelect={this.handleCategorySelect}></CategoryItem>)}</>)
		} else {
			return (<div>Loading..</div>)
		}
	}

	pollData () {
		window.fetch('/api/get_categories')
		  .then(response => response.json())
		  .then(categories => this.setState({ categories }));
	}

	componentDidMount() {
		this.pollData();
	}
}


class ClockView extends React.Component {
	constructor (props) {
		super(props);

		this.intervalID = 0;

		this.state = {
			time: new Date()
		}

		this.displayTime = this.displayTime.bind(this);

	}

	displayTime () {
		// var h = this.state.time.getHours();
		// var m = this.state.time.getMinutes();
		// return  this.state.time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
		return moment().format('h:mm A');
	}

	render() {
		return (<div className="clock">{this.displayTime()}</div>)
	}

	componentDidMount() {
		this.intervalID = setInterval(() => {
			this.setState({
				time: new Date()
			});
		}, 1000);
	}

	componentWillUnmount() {
		clearInterval(this.intervalID);
	}
}

class WeatherItem extends React.Component {
	constructor (props) {
		super(props)
	}

	formatTemp(temp) {
		temp = Math.round(temp * 10) / 10;
		return (<span className="temp">{temp}&deg;F</span>);
	}

	formatHumidity(humidity) {
		humidity = Math.round(humidity);
		return (<span className="humidity">{humidity}%</span>)
	}

	render () {
		return (<div><span className="weatherLocation">{this.props.friendlyName}</span> - {this.formatTemp(this.props.temp)} / {this.formatHumidity(this.props.humidity)}</div>)
	}
}

class WeatherView extends React.Component {
	constructor (props) {
		super(props)

		this.intervalID = 0;
		this.cycleInterval = 0;

		this.state = {
			data: {},
			cycle: 0,
			total: 0
		}
	}

	render () {
		if (Object.keys(this.state.data).length > 0) {
			let currentKey = Object.keys(this.state.data).filter(key => key !== 'weather')[this.state.cycle];

			return (<div className="weather">
				<WeatherItem friendlyName={this.state.data.weather.friendlyName} temp={this.state.data.weather.temp} humidity={this.state.data.weather.humidity}></WeatherItem>
				<WeatherItem friendlyName={this.state.data[currentKey].friendlyName} temp={this.state.data[currentKey].temp} humidity={this.state.data[currentKey].humidity}></WeatherItem>
			</div>)
		} else {
			return (<div></div>)
		}
	}

	cycleTemps() {
		let current = this.state.cycle + 1;
		if (current >= this.state.total) {
			current = 0;
		}
		this.setState({cycle: current});
	}

	pollData () {
		window.fetch('/api/get_data')
		  .then(response => response.json())
		  .then(data => this.setState({ 
			  data,
			  total: Object.keys(this.state.data).filter(key => key !== 'weather').length
			}));
	}

	componentDidMount() {
		this.pollData();
		this.intervalID = setInterval(() => this.pollData(), 30000);
		this.cycleInterval = setInterval(() => this.cycleTemps(), 5000);
	}
	componentWillUnmount() {
		clearInterval(this.intervalID);
	}
	
}

class HeaderView extends React.Component {
	constructor (props) {
		super(props)

		this.handleCategorySelect = this.handleCategorySelect.bind(this);
		this.backButton = this.backButton.bind(this);
	}

	handleCategorySelect() {
		this.props.handleCategorySelect(null);
	}

	backButton() {
		if (this.props.hasCategory) {
			return (<div className="button" onClick={this.handleCategorySelect}>Back</div>)
		}
	}

	getHeaderClass() {
		return navigator.userAgent.includes('9_3_5') ? 'header-nogrid' : 'header';
	}

	render () {
		return (<div className={this.getHeaderClass()}>
			<div>{this.backButton()}</div>
			<ClockView></ClockView>
			<WeatherView></WeatherView>
		</div>)
	}

}


class ActivityView extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			selectedCategory: null,
			advancedView: false
		};
		this.handleCategorySelect = this.handleCategorySelect.bind(this);
	}

	containerClass () {
		return navigator.userAgent.includes('9_3_5') ? 'container-nogrid' : 'container';
	}

	handleCategorySelect (category) {
		this.setState({selectedCategory: category});
	}

	render () {
		if (this.state.selectedCategory !== null) {
			return (<div>
				<HeaderView hasCategory={true} handleCategorySelect={this.handleCategorySelect}></HeaderView>
				<div className={this.containerClass()}><ActivityList items={[]} key={this.state.selectedCategory} category={this.state.selectedCategory}></ActivityList></div>
			</div>)
		} else {
			return (<div>
				<HeaderView hasCategory={false} ></HeaderView>
				<div className={this.containerClass()}><CategoryList categories={[]} handleCategorySelect={this.handleCategorySelect}></CategoryList></div>
			</div>)
		}
	}
}

class LightButton extends React.Component {

}

class LightControlView extends React.Component {
	constructor(props) {
		super(props);
	}


	render () {
		return (<div></div>);
	}
}


ReactDOM.render(<ActivityView></ActivityView>, document.getElementById('app'));

