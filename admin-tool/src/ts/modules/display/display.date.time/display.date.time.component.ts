import { DateTimeSettings, SettingsService } from '@admin-tool-modules/services/settingService/settings.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import moment from 'moment';
import { Observable, Subscription } from 'rxjs';



@Component({
  selector: 'display.date.time',
  imports: [FormsModule],
  templateUrl: './display.date.time.component.html',
  styleUrl: './display.date.time.component.less'
})

export class DisplayDateTimeComponent implements OnInit, OnDestroy{

  standardDateFormats: string[] = [
    'DD-MMM-YYYY',
    'DD/MM/YYYY',
    'MM/DD/YYYY'
  ];

  standardDatetimeFormats: string[] = [
    'DD-MMM-YYYY HH:mm:ss',
    'DD/MM/YYYY HH:mm:ss',
    'MM/DD/YYYY HH:mm:ss'
  ];

  dateFormatSelection!: string;
  dateTimeFormatSelection!: string;
  dateFormatExample!: string;
  dateTimeFormatExample!: string;

  settings$!: Observable<DateTimeSettings>;

  responseStatus:{
    loading?: boolean;
    success?: boolean;
    error?: boolean;
    msg?: string;
  } = {};

  private subscriptionDateTimeSettings!: Subscription ;
  
  

  constructor(private settingsService: SettingsService) {
  }

  ngOnInit(): void {
    this.settings$ = this.settingsService.getDateTimeSettings();
    
    this.subscriptionDateTimeSettings = this.settings$.subscribe(
      (settings: DateTimeSettings) => {
        this.dateFormatSelection = settings.dateFormat;
        this.dateTimeFormatSelection = settings.dateTimeFormat;
        this.dateFormatExample = moment().format(this.dateFormatSelection);
        this.dateTimeFormatExample = moment().format(this.dateTimeFormatSelection);
      }
    );
  }


  onDateFormatSelected(date:string) {
    this.dateFormatSelection = date;
    this.dateFormatExample = moment().format(this.dateFormatSelection);
  }
  onDateTimeFormatSelected(date:string) {
    this.dateTimeFormatSelection = date;
    this.dateTimeFormatExample = moment().format(this.dateTimeFormatSelection);
  }

  setSettingsDate(){
    this.responseStatus = {loading:true};

    this.settingsService.updateDateTimeSettings({
      dateFormat: this.dateFormatSelection,
      dateTimeFormat: this.dateTimeFormatSelection
    }).subscribe({
      next: () => {
        this.responseStatus = {success:true, msg:'Settings updated successfully'};
        setTimeout(() => {
          if(this.responseStatus.success){
            this.responseStatus = {};
          }
        }, 2000);
      },
      error: (error) => {
        console.error('Error updating settings', error);
        this.responseStatus = {error:true, msg:'Error updating settings'};
      }
    });
    
  }



  ngOnDestroy(): void {
    this.subscriptionDateTimeSettings.unsubscribe();
  }

}
