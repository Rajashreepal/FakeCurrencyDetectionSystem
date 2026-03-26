import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
 selector:'app-welcome',
 standalone: true,
 imports: [CommonModule],
 templateUrl:'./welcome.html'
})
export class WelcomeComponent{

 username = localStorage.getItem("username");

 constructor(private auth:AuthService, private router:Router){}

 logout(){
   this.auth.logout();
   this.router.navigate(['/login']);
 }
}