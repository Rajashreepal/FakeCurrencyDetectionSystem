import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html'
})
export class RegisterComponent {

  user:any={};

  constructor(private auth:AuthService){}

  register(){
    console.log('Registration data:', this.user);
    
    if (!this.user.username || !this.user.password || !this.user.role) {
      alert("Please fill in all fields");
      return;
    }
    
    this.auth.register(this.user).subscribe({
      next: (res)=>{
        console.log('Registration success:', res);
        alert("Registered Successfully");
      },
      error: (err)=>{
        console.error('Registration error:', err);
        alert("Registration failed: " + (err.error?.message || err.error || "Unknown error"));
      }
    });
  }
}