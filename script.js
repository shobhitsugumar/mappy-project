"use strict";

//prettier-ignore
const months=['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

//CLASS WORKOUT PARENT CLASS FOR CYCLING AND RUNNING
class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat,lng]
    this.distance = distance; //in km
    this.duration = duration; // in min
  }
  _setDiscription() {
    //prettier-ignore
    const months=['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.discription = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    }${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDiscription();
  }
  calcPace() {
    //min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = "cycling";
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.clacSpeed();
    this._setDiscription();
  }
  clacSpeed() {
    //km/hr
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

//CLASS APP
class App {
  #map;
  #mapEvent;
  #workoutarr = []; //creating a empty workout array and later pushing the element when submited )

  constructor() {
    //adding all the event handlers
    //get user position
    this._getPosition();

    //get data from local storage
    this.getLocalStorage();

    //Attahing event Handlers
    //when submitted the form the marker will show up
    form.addEventListener("submit", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggleElevationField);
    containerWorkouts.addEventListener("click", this.moveToPopup.bind(this));
  }

  //..................................................................................................................................
  //....................................................................................................................................

  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert("could not get your position");
        cono;
      }
    );
  }

  //................................................................................................................................
  //...................................................................................................................................

  _loadMap(position) {
    //we need the latitude and longitude
    const { latitude, longitude } = position.coords;

    const coords = [latitude, longitude];

    //using CDN;s way
    //inside the L.map (select the div where you want to display the map )

    this.#map = L.map("map").setView(coords, 13);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    ////////////////////////////////////
    //EVENT LISTENER WHEN MAP IS CLICKED

    this.#map.on("click", this._showForm.bind(this));
    this.#workoutarr.forEach((work) => this._renderWorkoutMarker(work));
  }

  //......................................................................................................................................................
  //.....................................................................................................................................................

  _showForm(mape) {
    this.#mapEvent = mape;

    form.classList.remove("hidden");
    inputDistance.focus();
  }

  //.....................................................................................................................................................
  //.......................................................................................................................................................
  hideMap() {
    //empty inputs
    inputDistance.value = "";
    inputCadence.value = "";
    inputDuration.value = "";
    inputElevation.value = "";

    //hide the form immediately to ignore the animation
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 1000);
  }

  //....................................................................................................................................................
  //.....................................................................................................................................................

  _toggleElevationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  //......................................................................................................................................................
  //.......................................................................................................................................................

  _newWorkout(e) {
    const validation = (...input) => input.every((inp) => Number.isFinite(inp));

    const allpositive = (...input) => input.every((inp) => inp > 0);

    e.preventDefault();

    //Get data from form
    const type = inputType.value;
    const distance = Number(inputDistance.value);
    const duration = Number(inputDuration.value);
    const { lat, lng } = this.#mapEvent.latlng; // getting the cordinates when clicked

    let workoutdata;

    //-------------------------------------------------------------
    // IF WORKOUT RUNNING ,CREATE A RUNNING OBJECT

    if (type === "running") {
      const cadence = Number(inputCadence.value);

      //Check if data is valid
      //guard clause
      if (
        /*!Number.isFinite(distance) ||
        !Number.isFinite(duration) ||
        !Number.isFinite(cadence)*/
        !validation(distance, duration, cadence) ||
        !allpositive(distance, duration, cadence)
      )
        return alert("Input have to be positive number ");

      //create running object
      workoutdata = new Running([lat, lng], distance, duration, cadence);
    }
    //*********************************************** */

    // IF WORKOUT CYCYLING ,CREATE A CYCLING OBJECT
    if (type === "cycling") {
      const elevation = Number(inputElevation.value);
      if (
        /*!Number.isFinite(distance) ||
        !Number.isFinite(duration) ||
        !Number.isFinite(elevation)*/
        !validation(distance, duration, elevation) ||
        !allpositive(distance, duration)
      )
        return alert("Input have to be positive number ");

      //creating a cycling objects
      workoutdata = new Cycling([lat, lng], distance, duration, elevation);
    }

    //-----------------------------------------------------------------
    //Add new object to workout array
    this.#workoutarr.push(workoutdata);
    console.log(this.#workoutarr);

    //RENDER WORKOUT ON LIST (SIDE BAR)
    this._renderworkouts(workoutdata);

    // Render workout on map as marker
    this._renderWorkoutMarker(workoutdata);

    //HIDE FORM + CLEARING THE INPUT FIELDS
    this.hideMap();

    //SET local storage for all workout

    this.setLocalStorage();
  }
  //*************************************************************************************** */
  _renderWorkoutMarker(workoutdata) {
    L.marker(workoutdata.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          //check the documentation
          maxWidth: 250,
          maxHeight: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workoutdata.type}-popup`,
        })
      )
      .setPopupContent(
        `${workoutdata.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${
          workoutdata.discription
        }`
      )
      .openPopup();
  }
  _renderworkouts(workoutdata) {
    //SOME DOM MANIPULATION
    let html = `
    <li class="workout workout--${workoutdata.type}" data-id=${workoutdata.id}>
          <h2 class="workout__title">${workoutdata.discription}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workoutdata.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
            }</span>
            <span class="workout__value">${workoutdata.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workoutdata.duration}</span>
            <span class="workout__unit">min</span>
          </div>
    `;

    if (workoutdata.type === "running") {
      html += `
      <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workoutdata.pace}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workoutdata.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>
 
      
      `;
    }
    if (workoutdata.type === "cycling") {
      html += `
      <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workoutdata.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workoutdata.elevation}</span>
      <span class="workout__unit">m</span>
    </div>
  </li>
      `;
    }
    form.insertAdjacentHTML("afterend", html);
  }
  moveToPopup(event) {
    const workoutEL = event.target.closest(".workout");
    console.log(workoutEL);
    //guard clause
    if (!workoutEL) return;
    const workout = this.#workoutarr.find(
      (work) => work.id === workoutEL.dataset.id
    );
    console.log(workout);
    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
  setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workoutarr));
  }
  getLocalStorage() {
    //concvert it back to obj
    const data = JSON.parse(localStorage.getItem("workouts"));
    console.log(data);

    //GUARD CLAUSE
    if (!data) return;

    this.#workoutarr = data;
    console.log(this.#workoutarr);

    this.#workoutarr.forEach((work) => this._renderworkouts(work));

    //you can put the marker here because when we reload the page before map get appeared
    //the marker get initialized this causes error so instead type it in loadmap method so that
    // after the map loads the marker gets showed

    //this.#workoutarr.forEach((work) => this._renderworkoutsMarker(work));
  }
  met() {
    console.log("thankyou");
  }
}

//obj 1
const app = new App();
