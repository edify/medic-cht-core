import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { delay, map, Observable, of, throwError } from 'rxjs';


export interface DateTimeSettings{
  dateFormat: string;
  dateTimeFormat: string;
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
        dateFormat: res.date_format,
        dateTimeFormat: res.reported_date_format
      }))
    );
   }

   updateDateTimeSettings(changes: DateTimeSettings): Observable<void>{
    return this.updateSettings({
      date_format: changes.dateFormat,
      reported_date_format: changes.dateTimeFormat
    });
   }




  getSettings(): Observable<any>{
    return this.http.get('/api/v1/settings' , {
      withCredentials: true
    });
  }

  updateSettings(updates, replace = false): Observable<void>{
    return this.http.put<void>('/api/v1/settings', updates, {
      params: {replace: String(replace)},
      headers: {'Content-Type': 'application/json'},
      withCredentials: true
    });
    // console.log('updateSettings info: ', updates);
    //return throwError(() => new Error('Mock error'));
    //return of(undefined).pipe(delay(1500));
  }


}
