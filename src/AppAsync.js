import React, { Component } from 'react'
import './App.css';
import axios from 'axios';
const ml5=window.ml5;


export default class App extends Component {
  constructor(props) {
    super(props)
    this.range={start: 0, end: 6};
    this.failed=false;
    this.batchProgress=0;
    this.batchSize=6;
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
    fetch("https://picsum.photos/v2/list?page=3&limit=100").then(res=>{
      return res.json();
    }).then(resData=>{
      console.log(resData)
      this.setState({pics: resData, onePic: resData[5].download_url},()=>this.restartAfterCrash())
    }).catch(error=>console.log(error))
  }
  
  restartAfterCrash=()=>{
    const classState=JSON.parse(localStorage.getItem("classifierState"));
    localStorage.clear();
    if(classState && classState.crashed){
      this.range={start: classState.start, end: classState.end};
      // restart classification from crash
      this.twoPicCreate(this.state.pics, this.range)
    }
    
  }

  
  classifyImage=(event)=>{
    const image=event.target;
    console.dir(event.target)

    ml5.imageClassifier('MobileNet')
      .then(classifier => classifier.classify(image))
      .then(results => {
        /* this.setState({
          probability: results[0].confidence.toFixed(4),
          result: results[0].label
        }) */
        console.dir(results[0])
      });
  }
  
  
  classifyImageState=(image, imageData, index)=>{

    ml5.imageClassifier('MobileNet')
      .then(classifier => classifier.classify(image))
      .then(results => {
        const classResult=results;
        console.dir(classResult)
        
        // post data to backend
        console.log(imageData, this.state)
        this.postData(imageData, classResult[0].label, image.src, index)
        
        /* this.setState({
          probability: results[0].confidence.toFixed(4),
          result: results[0].label,
          data: results
        }) */
        
      }).catch(error=>{
        console.log(error);
        // sometimes ap runs out of vram break out of loop and refresh page
        this.progressToNextBatch(this.batchProgress)
      })
  }

  progressToNextBatch=(index)=>{
    if(this.range.start<99){
      this.range.start+=index;
      this.range.end+=index;
      this.range.start=this.range.start<99? this.range.start : 99;
      this.range.end=this.range.end<99? this.range.end : 99;
      this.failed=true;
      localStorage.setItem("classifierState",JSON.stringify({...this.range, crashed: true}));
      window.location.reload(true);
    }
    else{
      localStorage.clear();
      console.log("done")
    }
  }

  postData = (file, tags, imageURL, index) => {
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
        /* window.alert('failure') */
      }).finally(()=>{
        // when everything is done refresh the page and start with new batch
        this.batchProgress++;
        URL.revokeObjectURL(imageURL)
        console.log("size: "+ this.batchSize)
        console.log("progress: "+ (this.batchProgress))
        if(this.batchProgress>=this.batchSize){
          this.batchProgress=0;
          this.progressToNextBatch(this.batchSize)
        }
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
    for(let i=0; i<fewPics.length; i++){
      if(this.failed){  
        break;
      }else{
        fetch(fewPics[i].download_url).then(response=>response.blob()).then(data=>{
          this.createImage(data).then((data)=>{
            /* this.setState({twoPic: data.imageElement.src}) */
            this.classifyImageState(data.imageElement, data.imageData, i)
          })
          .catch(error=>console.log(error))
    
        })
      } 
    }
  }

  render() {
    return (
    <div className="App">
      {/* this.state.pics.map(pic=>
        <img src={pic.download_url} alt="nothing"></img>
      ) */}
      {/* <img onClick={this.classifyImage} src={this.state.onePic} alt="error"/> */}
      <img /* onClick={this.classifyImage} */onClick={()=>this.twoPicCreate(this.state.pics, this.range)} src={this.state.twoPic} alt="error"/>
      
      <div>{this.state.probability}</div>
      <div>{this.state.result}</div>
      <form>
        <input type="file"></input>
      </form>
    </div>
    )
  }
}
