import React, { Component } from 'react'
import './App.css';
import panda from "./panda.jpg"
const ml5=window.ml5;


export default class App extends Component {
  constructor(props) {
    super(props)
  
    this.state = {
      pics: [],
      onePic: "",
      twoPic: "",
      probability: 0,
      result: "",
      data: {}
    }
  }
  componentDidMount(){
    fetch("https://picsum.photos/v2/list").then(res=>{
      return res.json();
    }).then(resData=>{
      console.log(resData)
      this.setState({pics: resData, onePic: resData[5].download_url})
    }).catch(error=>console.log(error))
  }
  classifyImage=(event)=>{
    const image=event.target;
    console.dir(event.target)

    ml5.imageClassifier('MobileNet')
      .then(classifier => classifier.classify(image))
      .then(results => {
        this.setState({
          probability: results[0].confidence.toFixed(4),
          result: results[0].label
        })
        console.dir(results[0])
      });
  }
  classifyImageState=(image)=>{

    ml5.imageClassifier('MobileNet')
      .then(classifier => classifier.classify(image))
      .then(results => {
        this.setState({
          probability: results[0].confidence.toFixed(4),
          result: results[0].label,
          data: results
        },()=>console.log(this.state))
      });
  }
  postData=()=>{
    const formData=new FormData();
    formData.append("name",1)
    formData.append();
  }

  createImage=(src)=>{
    return new Promise((resolve, reject)=>{
      console.log(src)
      const image=new Image();
      const imageData=URL.createObjectURL(src);
      image.src=imageData;
      image.crossOrigin="anonymous";
      image.onload=()=>resolve(image);
      image.onerror=reject;
    })
  }
  twoPicCreate=()=>{
    fetch(this.state.onePic).then(response=>response.blob()).then(data=>{
      this.createImage(data).then((data)=>{
        this.setState({twoPic: data.src})
        this.classifyImageState(data)
      })
      .catch(error=>console.log(error))

    })
  }

  render() {
    return (
    <div className="App">
      {/* this.state.pics.map(pic=>
        <img src={pic.download_url} alt="nothing"></img>
      ) */}
      {/* <img onClick={this.classifyImage} src={this.state.onePic} alt="error"/> */}
      <img /* onClick={this.classifyImage} */onClick={this.twoPicCreate} src={this.state.twoPic} alt="error"/>
      
      <div>{this.state.probability}</div>
      <div>{this.state.result}</div>
      <form>
        <input type="file"></input>
      </form>
    </div>
    )
  }
}
