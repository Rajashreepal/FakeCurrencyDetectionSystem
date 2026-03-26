import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {

  // Use the backend application URL (configured in your .NET app)
  api = "http://localhost:5277/api/auth";
  
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {}

  register(data:any){
    console.log('Sending registration request:', data);
    return this.http.post(this.api+"/register", data, this.httpOptions);
  }

  login(data:any){
    return this.http.post(this.api+"/login", data, this.httpOptions);
  }

  logout(){
    localStorage.removeItem("token");
    localStorage.removeItem("username");
  }

}
