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
      data: {},
      currentFile: null
    }
  }
  componentDidMount(){
    fetch("https://picsum.photos/v2/list?page=3&limit=100").then(res=>{
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
      })
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
      })
     
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
  
  classify=()=>{

  }

  handleFile=(event)=>{
    const file=event.target.files[0];
    console.log(file)
    this.setState({currentFile: URL.createObjectURL(file)});
  }

  render() {
    return (
    <div className="App">
      
      <img src={this.state.currentFile} alt="error"/>
      
      <div>{this.state.probability}</div>
      <div>{this.state.result}</div>
      <form className={'fileUpload'} onSubmit={this.classify}>
        <input type="file" onChange={this.handleFile}/>
        <input type="submit" />
      </form>
    </div>
    )
  }
}
