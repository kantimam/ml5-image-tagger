import React, { Component } from 'react'
import './App.css';
import panda from "./panda.jpg"
import axios from 'axios';
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
  
  
  classifyImageState=(image, imageData)=>{

    ml5.imageClassifier('MobileNet')
      .then(classifier => classifier.classify(image))
      .then(results => {
        const classResult=results;
        console.dir(classResult)
        
        // post data to backend
        console.log(imageData, this.state)
        this.postData(imageData, classResult[0].label, image.src)
        
        this.setState({
          probability: results[0].confidence.toFixed(4),
          result: results[0].label,
          data: results
        })
      })
  }


  postData = (file, tags, imageURL) => {
    const tagArrString = JSON.stringify(tags.split(","));
    let formData = new FormData()
    formData.append('file', file)
    formData.append('tags', tagArrString)

    const headers =  {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }

    const requestMode = "/posts"

    axios.post(`${"http://api.baizuo.online"}${requestMode}`, formData, headers).then(response => {
        console.log(response)
      })
      .catch((error) => {
        console.log(error);
        window.alert('failure')
      }).finally(()=>{
        URL.revokeObjectURL(imageURL)
      });
    
  }

  createImage=(src)=>{
    return new Promise((resolve, reject)=>{
      console.log(src)
      const image=new Image();
      const imageData=URL.createObjectURL(src);
      image.src=imageData;
      image.crossOrigin="anonymous";
      image.onload=()=>resolve({imageElement: image, imageData: src});
      image.onerror=reject;
    })
  }
  
  
  twoPicCreate=(picArray, range)=>{
    const fewPics=picArray.slice(range.start,range.end)
    fewPics.forEach(element=>{
      fetch(element.download_url).then(response=>response.blob()).then(data=>{
        this.createImage(data).then((data)=>{
          this.setState({twoPic: data.imageElement.src})
          this.classifyImageState(data.imageElement, data.imageData)
        })
        .catch(error=>console.log(error))
  
      })
    })
    
  }

  render() {
    return (
    <div className="App">
      {/* this.state.pics.map(pic=>
        <img src={pic.download_url} alt="nothing"></img>
      ) */}
      {/* <img onClick={this.classifyImage} src={this.state.onePic} alt="error"/> */}
      <img /* onClick={this.classifyImage} */onClick={()=>this.twoPicCreate(this.state.pics, {start:14, end:28})} src={this.state.twoPic} alt="error"/>
      
      <div>{this.state.probability}</div>
      <div>{this.state.result}</div>
      <form>
        <input type="file"></input>
      </form>
    </div>
    )
  }
}
