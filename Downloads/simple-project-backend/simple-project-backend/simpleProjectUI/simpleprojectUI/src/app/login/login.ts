import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
 selector:'app-login',
 standalone: true,
 imports: [CommonModule, FormsModule, RouterLink],
 templateUrl:'./login.html'
})
export class LoginComponent{

 user:any={};

 constructor(private auth:AuthService, private router:Router){}

 login(){
   this.auth.login(this.user).subscribe({
     next: (res:any)=>{
       localStorage.setItem("token",res.token);
       localStorage.setItem("username",this.user.username);
       this.router.navigate(['/welcome']);
     },
     error: (err)=>{
       alert("Login failed: " + (err.error?.message || err.error || "Unknown error"));
     }
   });
 }
}