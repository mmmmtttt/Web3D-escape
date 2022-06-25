import { Component, OnInit,Input } from '@angular/core';
// import { LoadingService } from 'src/app/services/loading.service';

@Component({
    selector:'app-loading',
    templateUrl:'./load.component.html',
    styleUrls: ['./load.component.css']
})

export class LoadingComponent implements OnInit{
    @Input()
    showGuide:boolean = false;
    
    constructor(){}//private loadingService:LoadingService
    
    ngOnInit(){
        console.log('Loading component oninit')
    }
}