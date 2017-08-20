import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { findDOMNode } from 'react-dom';

const propTypes = {
    color: PropTypes.string,
};

const defaultProps = {
    color: 'red',
};

window.requestAnimFrame = (function (callback) {
        return window.requestAnimationFrame || 
           window.webkitRequestAnimationFrame ||
           window.mozRequestAnimationFrame ||
           window.oRequestAnimationFrame ||
           window.msRequestAnimaitonFrame ||
           function (callback) {
                window.setTimeout(callback, 1000/60);
           };
})();

class DrawScreen extends Component {
    constructor(props) {
        super(props);

        this.state = {
            drawing: false,
            mousePosition: {
                x: 0,
                y: 0
            },
            lastPosition: {
                x: 0,
                y: 0
            }
        };

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.getMousePosition = this.getMousePosition.bind(this);
    }

    componentDidMount() {
        const { color } = this.props;
        this.canvasRef = findDOMNode(this.canvas);
        this.ctx = this.canvasRef.getContext('2d');
        this.ctx.strokeStyle = color;
        this.ctx.lineWith = 2;

    }

    onMouseDown(e) {
        console.log('dgdgd');
        this.setState({
            drawing: true,
            lastPosition: this.getMousePosition(this.canvasRef, e)
        });
    }

    onMouseUp(e) {
        
        this.setState({
            drawing: false
        });
    }

    onMouseMove(e) {
        if(this.state.drawing) {
            console.log(this.state);
            this.ctx.moveTo(this.state.lastPosition.x, this.state.lastPosition.y);
            this.ctx.lineTo(this.state.mousePosition.x, this.state.mousePosition.y);
            this.ctx.stroke();
        }
        this.setState({
            mousePosition: this.getMousePosition(this.canvasRef, e),
            lastPosition: this.state.mousePosition
        });
    }

    getMousePosition(canvasDom, mouseEvent) {
        const {top, left } = canvasDom.getBoundingClientRect();
        return {
            x: mouseEvent.clientX - left,
            y: mouseEvent.clientY - top
        };
    }

    render() {
        return (
            <canvas
                ref={(canvas) => { this.canvas = canvas; }}
                width={400}
                height={400}
                onMouseDown={this.onMouseDown}
                onMouseUp={this.onMouseUp}
                onMouseMove={this.onMouseMove}
            />
        );
    }
}

DrawScreen.propTypes = propTypes;
DrawScreen.defaultProps = defaultProps;


export default DrawScreen;