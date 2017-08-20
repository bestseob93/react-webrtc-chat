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
            },
            textareas: {
                send: false,
                received: false
            },
            btns: {
                startBtn: false,
                sendBtn: true,
                stopBtn: true
            },
            value: '',
            receivedValue: ''
        };

        this.sendChannel = null;
        this.receiveChannel = null;
        
        this.handleChange = this.handleChange.bind(this);

        this.trace = this.trace.bind(this);
        this.createConnection = this.createConnection.bind(this);
        this.sendData = this.sendData.bind(this);
        this.closeDataChannels = this.closeDataChannels.bind(this);
        this.gotLocalDescription = this.gotLocalDescription.bind(this);
        this.gotRemoteDescription = this.gotRemoteDescription.bind(this);
        this.gotLocalCandidate = this.gotLocalCandidate.bind(this);
        this.gotRemoteIceCandidate = this.gotRemoteIceCandidate.bind(this);
        this.gotReceiveChannel = this.gotReceiveChannel.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
        this.handleSendChannelStateChange = this.handleSendChannelStateChange.bind(this);
        this.handleReceiveChannelStateChange = this.handleReceiveChannelStateChange.bind(this);
        this.handleError = this.handleError.bind(this);

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.getMousePosition = this.getMousePosition.bind(this);
    }

    componentDidMount() {
        const { color } = this.props;
        this.canvasRef = findDOMNode(this.canvas);
        this.receivedCanvasRef = findDOMNode(this.receivedCanvas);

        this.ctx = this.canvasRef.getContext('2d');
        this.ctx.strokeStyle = color;
        this.ctx.lineWith = 2;
        this.receivedCtx = this.receivedCanvasRef.getContext('2d');
        this.receivedCtx.strokeStyle = color;
        this.receivedCtx.lineWith = 2;
        this.createConnection();
    }

    handleChange(e) {
        this.setState({
            value: e.target.value
        });
    }

    trace(text) {
        console.log((performance.now() / 1000).toFixed(3) + ": " + text);
    }

    // 커넥션 연결 부분
    createConnection() {
        const servers = null;
        window.localPeerConnection = new RTCPeerConnection(servers,
            {optional: [{RtcDataChannels: true}]});
        this.trace('Created local peer connection object localPeerConnection');
        
        try {
            // Reliable Data Channels not yet supported in Chrome
            this.sendChannel = window.localPeerConnection.createDataChannel("sendDataChannel",
            {reliable: false});
            this.trace('Created send data channel');
        } catch (e) {
            alert('Failed to create data channel. ' +
                'You need Chrome M25 or later with RtpDataChannel enabled');
            this.trace('createDataChannel() failed with exception: ' + e.message);
        }
        window.localPeerConnection.onicecandidate = this.gotLocalCandidate;
        this.sendChannel.onopen = this.handleSendChannelStateChange;
        this.sendChannel.onclose = this.handleSendChannelStateChange;
        
        window.remotePeerConnection = new RTCPeerConnection(servers,
            {optional: [{RtcDataChannels: true}]});
        this.trace('Created remote peer connection object remotePeerConnection');
        
        window.remotePeerConnection.onicecandidate = this.gotRemoteIceCandidate;
        window.remotePeerConnection.ondatachannel = this.gotReceiveChannel;
        
        window.localPeerConnection.createOffer(this.gotLocalDescription, this.handleError);
        this.setState({
            btns: {
                startBtn: true,
                stopBtn: false
            }
        });
    }

    // 데이터 보내기 (text area 이용 시)
    sendData() {
        let data = this.state.value;
        this.sendChannel.send(data);
        this.trace('Sent data: ' + data);
    }

    // 커넥션 끊기
    closeDataChannels() {
        this.trace('Closing data channels');
        this.sendChannel.close();
        this.trace('Closed data channel with label: ' + this.sendChannel.label);
        this.receiveChannel.close();
        this.trace('Closed data channel with label: ' + this.receiveChannel.label);
        window.localPeerConnection.close();
        window.remotePeerConnection.close();
        window.localPeerConnection = null;
        window.remotePeerConnection = null;
        this.trace('Closed peer connections');
        this.setState({
            btns: {
                startBtn: false,
                sendBtn: true,
                closeBtn: true
            },
            value: '',
            receivedValue: ''
        });
    }

    gotLocalDescription(desc) {
        window.localPeerConnection.setLocalDescription(desc);
        this.trace('Offer from localPeerConnection \n' + desc.sdp);
        window.remotePeerConnection.setRemoteDescription(desc);
        window.remotePeerConnection.createAnswer(this.gotRemoteDescription, this.handleError);
    }
      
    gotRemoteDescription(desc) {
        window.remotePeerConnection.setLocalDescription(desc);
        this.trace('Answer from remotePeerConnection \n' + desc.sdp);
        window.localPeerConnection.setRemoteDescription(desc);
    }
      
    gotLocalCandidate(event) {
        this.trace('local ice callback');
        if (event.candidate) {
          window.remotePeerConnection.addIceCandidate(event.candidate);
          this.trace('Local ICE candidate: \n' + event.candidate.candidate);
        }
    }
      
    gotRemoteIceCandidate(event) {
        this.trace('remote ice callback');
        if (event.candidate) {
          window.localPeerConnection.addIceCandidate(event.candidate);
          this.trace('Remote ICE candidate: \n ' + event.candidate.candidate);
        }
    }
      
    gotReceiveChannel(event) {
        this.trace('Receive Channel Callback');
        console.log(event);
        this.receiveChannel = event.channel;
        this.receiveChannel.onmessage = this.handleMessage;
        this.receiveChannel.onopen = this.handleReceiveChannelStateChange;
        this.receiveChannel.onclose = this.handleReceiveChannelStateChange;
    }
      
    handleMessage(event) {
        console.log('handleMessage');
        console.log(JSON.parse(event.data));
        console.log(typeof JSON.parse(event.data));
        let jsonData = JSON.parse(event.data);
        this.trace('Received message: ' + event.data);
        if(typeof jsonData === 'object') {
            console.log('asdfdsffsdfdsfs');
            this.receivedCtx.moveTo(jsonData.lastPosition.x, jsonData.lastPosition.y);
            this.receivedCtx.lineTo(jsonData.mousePosition.x, jsonData.mousePosition.y);
            this.receivedCtx.stroke();
        } else {
            this.setState({
                receivedValue: event.data
            });
        }
    }
      
    handleSendChannelStateChange() {
        let readyState = this.sendChannel.readyState;
        this.trace('Send channel state is: ' + readyState);
        if (readyState == "open") {
            this.setState({
                textareas: {
                    send: false,
                },
                btns: {
                    sendBtn: false,
                    stopBtn: false
                }
            });
        } else {
            this.setState({
                textareas: {
                    send: true,
                },
                btns: {
                    sendBtn: true,
                    stopBtn: true
                }
            });
        }
    }
      
    handleReceiveChannelStateChange() {
        let readyState = this.receiveChannel.readyState;
        this.trace('Receive channel state is: ' + readyState);
    }
      
    handleError(){}

    onMouseDown(e) {
        console.log('mouse clicked');
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

            let positions = {
                lastPosition: {
                    x: this.state.lastPosition.x,
                    y: this.state.lastPosition.y
                },
                mousePosition: {
                    x: this.state.mousePosition.x,
                    y: this.state.mousePosition.y
                }
            };
            this.sendChannel.send(JSON.stringify(positions));
            this.trace('Sent data: ' + JSON.stringify(positions));
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
            <div className="container">
                <canvas
                    ref={(canvas) => { this.canvas = canvas; }}
                    width={400}
                    height={400}
                    style={{border: "1px solid red"}}
                    onMouseDown={this.onMouseDown}
                    onMouseUp={this.onMouseUp}
                    onMouseMove={this.onMouseMove}
                />
                <canvas
                    ref={(canvas) => { this.receivedCanvas = canvas; }}
                    width={400}
                    height={400}
                    style={{border: "1px solid blue"}}
                />
                <br />
                <textarea
                    ref={(textarea) => this.dataChannelSend = textarea}
                    disabled={this.state.textareas.send}
                    onChange={this.handleChange}
                    value={this.state.value}
                    placeholder="Press Start, enter some text, then press Send."></textarea>
                <textarea
                    id="dataChannelReceive"
                    disabled={this.state.textareas.received}
                    value={this.state.receivedValue}
                    ></textarea>

                <div id="buttons">
                    <button disabled={this.state.btns.startBtn} ref={(btn) => this.startButton = btn} onClick={this.createConnection}>Start</button>
                    <button disabled={this.state.btns.sendBtn} ref={(btn) => this.sendButton = btn} onClick={this.sendData}>send</button>
                    <button disabled={this.state.btns.stopBtn} ref={(btn) => this.stopButton = btn} onClick={this.closeDataChannels}>stop</button>
                </div>
            </div>
        );
    }
}

DrawScreen.propTypes = propTypes;
DrawScreen.defaultProps = defaultProps;


export default DrawScreen;