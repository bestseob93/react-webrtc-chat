import React, { Component } from 'react';
import {
  BrowserRouter as Router,
  Route
} from 'react-router-dom';
import { DrawScreen, HomeScreen } from 'containers';
import 'styles/App.css';

class App extends Component {
  render() {
    return (
      <Router>
        <div>
        <Route exact path="/" component={HomeScreen}/>
        <Route path="/drawTest" component={DrawScreen}/>
        </div>
      </Router>
    );
  }
}

export default App;
