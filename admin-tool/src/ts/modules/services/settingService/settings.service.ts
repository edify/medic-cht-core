import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { delay, map, Observable, of, throwError } from 'rxjs';


export interface DateTimeSettings{
  dateFormat: string;
  dateTimeFormat: string;
}
const mockSettings ={
  dateFormat: 'DD-MMM-YYYY',
  dateTimeFormat: 'DD-MMM-YYYY HH:mm:ss'
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  private http: HttpClient;

  constructor(private httpClient: HttpClient) { 
    this.http = httpClient;
  }



 getDateTimeSettings(): Observable<DateTimeSettings>{
    return this.getSettings().pipe(
      map( res => ({
        dateFormat: res.dateFormat,
        dateTimeFormat: res.dateTimeFormat
      }))
    );
   }

   updateDateTimeSettings(changes: DateTimeSettings): Observable<void>{
    return this.updateSettings(changes);
   }




  getSettings(): Observable<any>{
    //return this.http.get('/api/v1/settings');
    return of(mockSettings);
  }

  updateSettings(updates, replace = false): Observable<void>{
    // return this.http.put<void>('/api/v1/settings', updates, {
    //   params: {replace: String(replace)},
    //   headers: {'Content-Type': 'application/json'}
    // });
    console.log('updateSettings info: ', updates);
    //return throwError(() => new Error('Mock error'));
    return of(undefined).pipe(delay(1500));
  }


}
