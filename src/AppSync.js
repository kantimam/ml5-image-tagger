import React, { Component } from 'react'
import './App.css';
import axios from 'axios';
const ml5=window.ml5;


export default class App extends Component {
  constructor(props) {
    super(props)
    this.range={start: 7, end: 13};
    this.failed=false;
    this.batchProgress=0;
    this.batchSize=6;
    this.state = {
      pics: [],
      onePic: "",
      twoPic: "",
      probability: 0,
      result: "",
      data: {},
      start: 0,
      end: 0
    }
  }
  componentDidMount(){
    fetch("https://picsum.photos/v2/list?page=10&limit=100").then(res=>{
      return res.json();
    }).then(resData=>{
      console.log(resData)
      this.setState({pics: resData, onePic: resData[5].download_url})
    }).catch(error=>console.log(error))
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

  
  twoPicCreate=async(picArray, range)=>{
    const fewPics=picArray.slice(range.start,range.end)
    for(let i=0; i<fewPics.length; i++){
      if(this.failed){  
        break;
      }else{
        const response=await fetch(fewPics[i].download_url);
        const json=await response.blob();
        const image=await this.createImage(json);
        const model=await ml5.imageClassifier('MobileNet');
        const results=await model.classify(image.imageElement);
        console.log(`label: ${results[0].label} with confidence: ${results[0].confidence}`)
        console.log(results)
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
