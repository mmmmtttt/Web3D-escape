import { getCheckpointName } from './../../game/utils/utils';
import { Component, OnInit } from '@angular/core';
import { AuthService } from './../../services/auth.service';
import { Router } from '@angular/router';
import { ProfileDetail } from 'src/app/models/profileDetail';
import { EChartsOption } from 'echarts';
import { BehaviorData } from 'src/app/models/behaviorData';
import { record } from 'src/app/models/historyRecord';
import { RoomSelectService } from './../../services/room-select.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})


export class ProfileComponent implements OnInit {
  ProfileDetail! : ProfileDetail
  BehaviorData! : BehaviorData
  isLoaded : boolean = false;

  note = 'This guy is too lazy to leave anything...';

  record!:record
  records:record[] = []

  //表格
  chartOption:EChartsOption = {}
  attributeChart:EChartsOption = {}
  victoryChart:EChartsOption = {}
     
  constructor(private account : AuthService,private router:Router,private roomService:RoomSelectService)
  { 
    this.ProfileDetail = {
      username: " ",
      gender:"1",
      portraitId:0
    }
    this.BehaviorData = {
      correct:0,
      wrong:0,
      CA:0,
      CN:0,
      Cypher:0,
      DS:0,
      Other:0
    }
  }
     
  ngOnInit(): void {
    console.log('profile component oninit')
    this.loadData();
    window.scroll(0,0);
    this.initChart();
  }

  loadData(){
    this.account.getUserProfile().subscribe( result => {
      this.ProfileDetail = result['data'];
    });

    this.account.getUserBehavior().subscribe( result =>{
      this.BehaviorData = result['data'];
      this.initChart();
    });

    this.account.getHistoryRecord().subscribe( data =>{
      this.records = data['data']
      for(let i:number = 0;i<this.records.length;i++){
        this.record = this.records[i]
        this.records[i].roomId = this.roomService.getRoomName(Number(this.record.roomId))
        console.log(this.records[i].roomId)
      }
    });
  }

  logOut(){
    this.account.logout(this.router);
  }

  getName(id:number){
    return getCheckpointName(id);
  }

  initChart(){
    this.attributeChart = {
      title:{
        text:'Attributes'
      },
      radar:{
        indicator:[
          {name:'Computer Architecture',max:10},
          {name:'Other',max:10},
          {name:'Computer Network',max:10},
          {name:'Cryptography',max:10},
          {name:'Data Struture',max:10}
        ],
        axisName: {
          color: '#666',
          fontWeight:'bold'
        }
      },
      series:[
        {
          type:'radar',
          data:[
            {
              value:[this.BehaviorData.CA,this.BehaviorData.Other,this.BehaviorData.CN,this.BehaviorData.Cypher,this.BehaviorData.DS],
              name:'Percent'
            }
          ]
        }
      ]
    };

    this.victoryChart = {
      title:{
        text:'Accurancy',
        left:'center'
      },
      tooltip:{
        trigger:'item'
      },
      legend:{
        orient:'vertical',
        left:'left'
      },
      series:[{
        type:'pie',
        radius:['40%','70%'],
        avoidLabelOverlap:false,
        itemStyle:{
          borderRadius: 8,
          borderColor:'#fff',
          borderWidth:2
        },
        label:{
          show:false,
          position:'center'
        },
        emphasis:{
          label:{
            show:true,
            fontSize:'20',
            fontWeight:'bold'
          }
        },
        labelLine:{
          show:false
        },
        data:[
          { value : this.BehaviorData.correct, name:'Correct'},
          { value : this.BehaviorData.wrong , name:'Wrong'}
        ]
      }]

    }
  };

  logout(){
    this.account.logout(this.router);
  }
}
