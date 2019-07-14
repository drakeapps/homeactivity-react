
import "@babel/polyfill";
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import 'whatwg-fetch';
// import humanizeDuration from 'humanize-duration';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulbSlash, faLightbulbOn, faLightbulb } from '@fortawesome/pro-light-svg-icons';
import {XYPlot, XAxis, YAxis, HorizontalGridLines, VerticalGridLines, LineSeries} from 'react-vis';




import './index.scss';

class ActivityItem extends React.Component {
	constructor (props) {
		super(props)

		this.state = {
			pk: this.props.pk,
			pending: false,
			lastTime: this.props.lastTime,
			nextTime: this.props.nextTime
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
		},
		(error) => {
			console.log(error);
		});
	}
	componentWillReceiveProps(nextProps) {
		if(this.props != nextProps) {
			this.setState({
				pk: nextProps.pk,
				pending: false,
				lastTime: nextProps.lastTime,
				nextTime: nextProps.nextTime
			});
		}
	}

	render () {
		return (
			<div className={this.getStatusClass()} id={'activityItem' + this.state.pk} key={this.props.pk} onClick={(e) => this.markDone(this, e)}>
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
			return (<>{this.state.items.map((item, index) => <ActivityItem activityText={item.activity_text} lastTime={item.last_checkin} nextTime={item.next_checkin} pk={item.pk} key={item.pk} ></ActivityItem>)}</>)
		} else {
			return (<div>Loading..</div>)
		}

		// return (<div className="container">{rows.map(item => <React.Fragment>{item}</React.Fragment>)}</div>)
	}

	pollData () {
		window.fetch('/api/category.json/' + this.state.category + '?' + Date.now())
		  .then(response => response.json())
		  .then((items) => {
				// items.sort((a,b) => (a.next_checkin > b.next_checkin) ? 1 : -1);
				items.sort((a,b) => a.next_checkin - b.next_checkin);
				this.setState({ items })
		  },
		  (error) => {
			  console.log('request failed');
		  });
	}

	componentDidMount() {
		this.pollData();
		this.intervalID = setInterval(() => this.pollData(), 5000);
	}
	componentWillUnmount() {
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
		window.fetch('/api/get_categories?' + Date.now())
		  .then(response => response.json())
		  .then(categories => this.setState({ categories }),
		  (error) => {
			  console.log(error);
		  });
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
		window.fetch('/api/get_data?simple=true&' + Date.now())
		  .then(response => response.json())
		  .then(data => this.setState({ 
			  data,
			  total: Object.keys(this.state.data).filter(key => key !== 'weather').length
			}),
			(error) => {
				console.log(error);
			});
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
		this.showLights = this.showLights.bind(this);
		this.backButton = this.backButton.bind(this);
	}

	handleCategorySelect() {
		this.props.handleCategorySelect(null);
	}

	showLights() {
		this.props.showLights();
	}

	backButton() {
		if (this.props.showBackButton) {
			return (<div className="button" onClick={this.handleCategorySelect}>Back</div>)
		} else {
			return (<div className="button grey-button" onClick={this.showLights}><FontAwesomeIcon icon={faLightbulb}></FontAwesomeIcon></div>)
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


class LightButton extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			pending: false
		}

		this.getLogo = this.getLogo.bind(this);
		this.pollData = this.pollData.bind(this);
		this.getClass = this.getClass.bind(this);
		this.switchLight = this.switchLight.bind(this);
	}

	getLogo() {
		if (this.props.status) {
			return (<FontAwesomeIcon icon={faLightbulbOn} />);
		} else {
			return (<FontAwesomeIcon icon={faLightbulbSlash} />);
		}
	}

	getClass() {
		let className = 'item';
		if (this.state.pending) {
			className += ' pulseBox';
		}
		if (this.props.status) {
			className += ' light-on';
		}

		return className;
	}

	pollData() {
		this.props.pollData();
	}

	switchLight() {
		this.setState({pending: true});
		window.fetch('/api/set_lights', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'

			},
			body: JSON.stringify({
				name: this.props.name,
				action: !this.props.status
			})
		}).then(response => {
			this.pollData();
			this.setState({pending: false});
		},
		(error) => {
			console.log(error);
		});
	}

	render () {
		if (this.props.friendlyName != ""){
			return (<div className={this.getClass()} onClick={this.switchLight}>
				<div>{this.getLogo()}</div>
				<div>{this.props.friendlyName}</div>
			</div>);
		} else {
			return (<></>);
		}
	}
}

class LightControlView extends React.Component {
	constructor(props) {
		super(props);

		this.intervalID = 0;
		
		this.state = {
			lights: []
		}

		this.pollData = this.pollData.bind(this);
	}

	render () {
		if (this.state.lights.length > 0) {
			return (<>{this.state.lights.map((item, index) => <LightButton name={item.name} friendlyName={item.friendlyName} key={item.name} pollData={this.pollData} status={item.status}></LightButton>)}</>)
		} else {
			return (<div>Loading..</div>)
		}
	}

	pollData () {
		window.fetch('/api/get_lights?' + Date.now())
		  .then(response => response.json())
		  .then(lights => this.setState({ lights }),
		  (error) => {
			  console.log(error);
		  });
	}

	componentDidMount() {
		this.pollData();
		this.intervalID = setInterval(() => this.pollData(), 5000);
	}

	componentWillUnmount() {
		clearInterval(this.intervalID);
	}
}


class SensorGraph extends React.Component {
	constructor(props) {
		super(props);

		this.handleData = this.handleData.bind(this);
	}

	// returns x/y pairing based on the type of data requested
	handleData (type) {
		let data = [];
		console.log(type);

		this.props.data.forEach((item) => {
			data.push({
				x: moment.unix(item['time']),
				y: item[type]
			});
		});
		console.log(data);
		return data;
	}

	render() {
		console.log('rendering graph');
		return (<div className="sensor-container">
			<div className="sensor-labels">
				<div className="sensor-title">{this.props.friendlyName}</div>
				<div className="sensor-temp">{this.props.temp.toFixed(2)}&deg;F</div>
				<div className="sensor-humidity">{this.props.humidity.toFixed(1)}%</div>
			</div>
			<div className="sensor-graph">
				<XYPlot height={200} width= {window.innerWidth - 150} xType="time">
					<VerticalGridLines />
					<HorizontalGridLines />
					<XAxis />
					<YAxis />
					<LineSeries data={this.handleData('humidity')} stroke="blue" />
					<LineSeries data={this.handleData('temp')} stroke="red" />
				</XYPlot>
			</div>
		</div>);
	}


}

class SensorContainer extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			data: []
		}

		this.intervalID = 0;
	}

	pollData () {
		window.fetch('/api/get_data?' + Date.now())
		  .then(response => response.json())
		  .then(data => this.setState({ 
			  data
			}),
			(error) => {
				console.log(error);
			});
	}

	componentDidMount() {
		this.pollData();
		this.intervalID = setInterval(() => this.pollData(), 30000);
	}
	componentWillUnmount() {
		clearInterval(this.intervalID);
	}

	render() {
		if (Object.keys(this.state.data).length > 0) {
			return (<div>
				{Object.entries(this.state.data).map((key) => <SensorGraph data={key[1].historical} key={key[0]} friendlyName={key[1].friendlyName} humidity={key[1].humidity} temp={key[1].temp}></SensorGraph>)}
			</div>)
		} else {
			return (<div>Loading..</div>);
		}
		
	}
}


class ActivityView extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			selectedCategory: null,
			advancedView: false,
			showLights: false,
			showSensors: false
		};
		this.handleCategorySelect = this.handleCategorySelect.bind(this);
		this.showLights = this.showLights.bind(this);
	}

	containerClass () {
		return navigator.userAgent.includes('9_3_5') ? 'container-nogrid' : 'container';
	}

	handleCategorySelect (category) {
		this.setState({selectedCategory: category, showLights: false, showSensors: false});
	}

	showLights () {
		this.setState({showLights: true});
	}

	showSensors() {
		this.setState({showSensors: true});
	}

	render () {
		const header = 
			<HeaderView 
				showBackButton={(this.state.showSensors || this.state.showLights || this.state.selectedCategory !== null)} 
				handleCategorySelect={this.handleCategorySelect} showLights={this.showLights}>
			</HeaderView>;

		let content = null;

		if (this.state.showSensors) {
			content = (<div>
				<SensorContainer></SensorContainer>
			</div>)
		} else if (this.state.showLights) {
			content = (<div>
				<div className={this.containerClass()}><LightControlView lights={[]} key='lights'></LightControlView></div>
			</div>)
		}
		else if (this.state.selectedCategory !== null) {
			content = (<div>
				<div className={this.containerClass()}><ActivityList items={[]} key={this.state.selectedCategory} category={this.state.selectedCategory}></ActivityList></div>
			</div>)
		} else {
			content = (<div>
				<div className={this.containerClass()}><CategoryList categories={[]} handleCategorySelect={this.handleCategorySelect}></CategoryList></div>
			</div>)
		}

		return (<div>{header}{content}</div>);
	}
}


class HomeScreenView extends React.Component {
	constructor (props) {
		super(props);
	}



	render() {
		return <div className="homescreen-container">
			<div className="left-rail">
				<div className="activity-container">
					<div className="activity-item">Test1</div>
					<div className="activity-item">Test2</div>
					<div className="activity-item">Test3</div>
					<div className="activity-item">Test4</div>
					<div className="activity-item">Test5</div>
				</div>
				
			</div>
			<div className="center-rail">
				<div className="weather-outside">
					<div className="weather-icon"></div>
					<div className="weather-temp">76 &deg;F - 75% Humidity</div>
					<div className="weather-forecast">Sunny</div>
					<div className="weather-lastupdate">a few seconds ago</div>
				</div>
				<div className="clock">12:00 AM</div>
				<div className="sensors-container">
					<div className="sensor-item">
						<div className="sensor-name">Garage</div>
						<div className="sensor-data">80 &deg;F - 80% Humidity</div>
					</div>
					<div className="sensor-item">
						<div className="sensor-name">Garage Attic</div>
						<div className="sensor-data">80 &deg;F - 80% Humidity</div>
					</div>
					<div className="sensor-item">
						<div className="sensor-name">Attic</div>
						<div className="sensor-data">80 &deg;F - 80% Humidity</div>
					</div>
				</div>
			</div>
			<div className="right-rail">
				<div className="lights-container">
					<div className="light-container on">
						Living Room
					</div>
					<div className="light-container off">
						Kitchen
					</div>
				</div>
			</div>
		</div>;
	}
}

// ReactDOM.render(<ActivityView></ActivityView>, document.getElementById('app'));
ReactDOM.render(<HomeScreenView></HomeScreenView>, document.getElementById('app'));

